-- =====================================================================
-- 04_storage.sql  |  Plataforma Personal Trainer
-- Buckets PRIVADOS + policies de acesso aos arquivos.
-- Rode DEPOIS do 03_rls_policies.sql.
--
-- Convenção de caminhos (as policies dependem dela):
--   progress-photos  : {student_id}/{set_id}/{angulo}-{uuid}.webp
--   chat-attachments : {conversation_id}/{uuid}.webp
--   exercise-media   : {owner_id | global}/{exercise_id}/{arquivo}
--   avatars          : {user_id}/avatar.webp
--
-- NUNCA crie bucket público para dados de alunos. O acesso é por URL assinada
-- (createSignedUrl), gerada só para quem passa na policy de SELECT.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('progress-photos',  'progress-photos',  false,  5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('chat-attachments', 'chat-attachments', false,  5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('exercise-media',   'exercise-media',   false, 52428800, array['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']),
  ('avatars',          'avatars',          false,  2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- progress-photos
--   aluno: vê/envia/exclui as PRÓPRIAS (envio exige consentimento fotos_evolucao)
--   personal: vê/envia as dos SEUS alunos, somente com consentimento ativo
-- ---------------------------------------------------------------------
create policy app_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'progress-photos' and private.can_view_photos(private.storage_uuid(name, 1)));

create policy app_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'progress-photos' and private.can_add_photos(private.storage_uuid(name, 1)));

create policy app_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'progress-photos' and private.is_own_student(private.storage_uuid(name, 1)));

-- ---------------------------------------------------------------------
-- chat-attachments: só os dois participantes da conversa
-- ---------------------------------------------------------------------
create policy app_chat_select on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-attachments'
         and private.is_conversation_participant(private.storage_uuid(name, 1)));

create policy app_chat_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-attachments'
              and private.can_post_in_conversation(private.storage_uuid(name, 1)));

-- ---------------------------------------------------------------------
-- exercise-media
--   leitura: quem pode ver o exercício (Personal: globais+próprios; aluno: os do treino dele)
--   escrita: só o Personal dono, na pasta dele. Pasta "global" = somente service_role.
-- ---------------------------------------------------------------------
create policy app_exmedia_select on storage.objects
  for select to authenticated
  using (bucket_id = 'exercise-media' and private.can_view_exercise(private.storage_uuid(name, 2)));

create policy app_exmedia_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'exercise-media'
    and private.storage_uuid(name, 1) = (select auth.uid())
    and private.owns_exercise(private.storage_uuid(name, 2))
  );

create policy app_exmedia_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'exercise-media'
    and private.storage_uuid(name, 1) = (select auth.uid())
    and private.owns_exercise(private.storage_uuid(name, 2))
  )
  with check (
    bucket_id = 'exercise-media'
    and private.storage_uuid(name, 1) = (select auth.uid())
    and private.owns_exercise(private.storage_uuid(name, 2))
  );

create policy app_exmedia_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'exercise-media'
    and private.storage_uuid(name, 1) = (select auth.uid())
    and private.owns_exercise(private.storage_uuid(name, 2))
  );

-- ---------------------------------------------------------------------
-- avatars: cada um na própria pasta; Personal e seus alunos se enxergam
-- ---------------------------------------------------------------------
create policy app_avatars_select on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and private.can_view_profile(private.storage_uuid(name, 1)));

create policy app_avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and private.storage_uuid(name, 1) = (select auth.uid()));

create policy app_avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and private.storage_uuid(name, 1) = (select auth.uid()))
  with check (bucket_id = 'avatars' and private.storage_uuid(name, 1) = (select auth.uid()));

create policy app_avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and private.storage_uuid(name, 1) = (select auth.uid()));
