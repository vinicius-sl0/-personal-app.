-- =====================================================================
-- 20261003000001_chat_midia.sql  |  Plataforma Personal Trainer
--
-- FOTO E ÁUDIO NO CHAT. A tabela messages já tinha os tipos 'imagem' e 'audio' e a
-- coluna attachment_path; o bucket privado chat-attachments já existia (só os dois
-- participantes da conversa leem/enviam). Esta migração completa:
--
--   1. bucket aceita também ÁUDIO (gravado no próprio app);
--   2. messages.media_duration_s: duração do áudio em segundos (o arquivo gravado pelo
--      navegador nem sempre informa a duração; o app mede e grava aqui);
--   3. o banco confere o anexo: arquivo do tipo certo, DENTRO da pasta da própria conversa
--      e já enviado ao bucket (não dá para apontar para arquivo de outra conversa);
--   4. quem enviou o arquivo pode apagá-lo (ao apagar a mensagem, o app apaga o arquivo).
--
-- Caminho dos arquivos: chat-attachments/{conversation_id}/{message_id}.{webp|jpg|webm|ogg|m4a|mp4}
-- Depois de rodar: rode de novo o scripts/08_testes_permissoes.sql.
-- =====================================================================

-- 1. Bucket: imagens (como antes) + áudio. Limite de 5 MB por arquivo (3 min de áudio ≈ 1–3 MB).
update storage.buckets
   set allowed_mime_types = array[
         'image/jpeg', 'image/png', 'image/webp',
         'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/mpeg'
       ],
       file_size_limit = 5242880
 where id = 'chat-attachments';

-- 2. Duração do áudio
alter table public.messages add column if not exists media_duration_s smallint;
alter table public.messages drop constraint if exists messages_media_duration_ck;
alter table public.messages
  add constraint messages_media_duration_ck
  check (media_duration_s is null or (type = 'audio' and media_duration_s between 1 and 600));

grant insert (media_duration_s) on public.messages to authenticated;

-- 3. Conferência do anexo (substitui a função antiga, que só checava a resposta).
--    security definer: precisa consultar storage.objects.
create or replace function private.messages_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_prefix text := new.conversation_id::text || '/';
begin
  if new.reply_to_id is not null and not exists (
    select 1 from public.messages m
    where m.id = new.reply_to_id and m.conversation_id = new.conversation_id
  ) then
    raise exception 'A mensagem respondida precisa pertencer a mesma conversa'
      using errcode = '23514';
  end if;

  if new.type = 'texto' then
    if new.attachment_path is not null then
      raise exception 'ANEXO_INVALIDO: mensagem de texto nao leva arquivo' using errcode = '23514';
    end if;
  elsif new.type in ('imagem', 'audio') then
    if new.attachment_path is null
       or left(new.attachment_path, char_length(v_prefix)) <> v_prefix
       or new.attachment_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.[a-z0-9]{2,4}$'
       or (new.type = 'imagem' and new.attachment_path !~ '\.(webp|jpg|jpeg|png)$')
       or (new.type = 'audio' and new.attachment_path !~ '\.(webm|ogg|m4a|mp4|aac|mp3)$') then
      raise exception 'ANEXO_INVALIDO: arquivo fora da pasta da conversa ou de tipo errado' using errcode = '23514';
    end if;
    if not exists (
      select 1 from storage.objects o
       where o.bucket_id = 'chat-attachments' and o.name = new.attachment_path
    ) then
      raise exception 'ANEXO_INVALIDO: arquivo ainda nao foi enviado' using errcode = '23514';
    end if;
    if new.type = 'audio' then
      new.body := null; -- áudio não tem legenda
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function private.messages_before_insert() from public, anon, authenticated;

-- 4. Apagar o arquivo: só quem o enviou (owner_id é gravado pelo Storage no envio).
drop policy if exists app_chat_delete on storage.objects;
create policy app_chat_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'chat-attachments' and owner_id = (select auth.uid())::text);
