-- =====================================================================
-- 20260926000001_chat_leitura.sql  |  Plataforma Personal Trainer
--
-- Status "Lida" no chat: cada participante da conversa passa a enxergar até
-- onde o OUTRO leu (conversation_reads.last_read_at). Antes cada um só via
-- o próprio registro.
--   • Leitura: só os dois participantes da conversa (Personal e o aluno).
--   • Escrita: continua igual — cada um só grava a própria leitura.
-- Também liga o tempo real nessa tabela, para o "Lida" aparecer na hora.
--
-- Pode ser rodado mais de uma vez. Depois rode de novo o scripts/08_testes_permissoes.sql.
-- =====================================================================

drop policy if exists conv_reads_select on public.conversation_reads;
create policy conv_reads_select on public.conversation_reads
  for select to authenticated
  using (private.is_conversation_participant(conversation_id));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.conversation_reads;
    exception when duplicate_object or feature_not_supported then null;
    end;
  end if;
end;
$$;
