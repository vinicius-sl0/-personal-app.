-- =====================================================================
-- 03_rls_policies.sql  |  Plataforma Personal Trainer
-- Privilégios mínimos + Row Level Security + Policies.
-- Rode DEPOIS do 02_funcoes_triggers.sql.
--
-- Modelo de defesa em camadas:
--   1) GRANTs: o papel "anon" não acessa NADA; "authenticated" só as
--      operações/colunas listadas aqui.
--   2) RLS: decide QUAIS LINHAS cada usuário enxerga/altera.
--   3) Triggers (02): impedem alterar campos sensíveis.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PRIVILÉGIOS
-- ---------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon;

-- Tabelas/funções criadas no futuro também nascem SEM acesso público:
-- toda tabela nova exigirá GRANT explícito + RLS (mais seguro).
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon;

grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Somente leitura
grant select on
  public.muscle_groups, public.equipment, public.student_invites,
  public.conversations, public.audit_logs, public.v_student_metric_series,
  public.profiles, public.personal_profiles, public.consents, public.messages
to authenticated;

-- CRUD (as linhas permitidas são decididas pelas policies)
grant select, insert, update, delete on
  public.students, public.student_private_notes,
  public.exercises, public.exercise_muscle_groups, public.exercise_media,
  public.workout_plans, public.workouts, public.workout_exercises,
  public.workout_sessions, public.set_logs,
  public.assessment_metrics, public.assessment_protocols, public.assessment_protocol_metrics,
  public.assessments, public.assessment_values,
  public.progress_photo_sets, public.progress_photos,
  public.notification_preferences, public.push_subscriptions
to authenticated;

-- Sem exclusão
grant select, insert, update on
  public.anamneses, public.weekly_checkins, public.conversation_reads
to authenticated;

-- Privilégios POR COLUNA (o usuário nunca altera role, ids, timestamps de sistema etc.)
grant update (full_name, phone, avatar_path, timezone, locale) on public.profiles          to authenticated;
grant update (cref, bio, business_name)                        on public.personal_profiles to authenticated;
grant insert (user_id, student_id, type, version, ip, user_agent) on public.consents       to authenticated;
grant update (revoked_at)                                      on public.consents          to authenticated;
grant insert (id, conversation_id, sender_id, type, body, attachment_path, reply_to_id)
                                                               on public.messages          to authenticated;
grant update (deleted_at)                                      on public.messages          to authenticated;
grant select, delete                                           on public.notifications     to authenticated;
grant update (read_at)                                         on public.notifications     to authenticated;

-- ---------------------------------------------------------------------
-- 2. HABILITAR RLS EM TODAS AS TABELAS DO SCHEMA PUBLIC
--    (sem policy = ninguém acessa; policies abaixo liberam o necessário)
-- ---------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. POLICIES
-- ---------------------------------------------------------------------

-- ============================ profiles ===============================
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_related on public.profiles
  for select to authenticated
  using (private.can_view_profile(id));   -- Personal vê seus alunos; aluno vê seu Personal

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- INSERT/DELETE: nenhum. Perfis nascem por trigger/SQL do servidor.

-- ======================== personal_profiles ==========================
create policy personal_profiles_select on public.personal_profiles
  for select to authenticated
  using (profile_id = (select auth.uid()) or profile_id = (select private.my_personal_id()));

create policy personal_profiles_update_self on public.personal_profiles
  for update to authenticated
  using (profile_id = (select auth.uid()) and (select private.is_personal()))
  with check (profile_id = (select auth.uid()) and (select private.is_personal()));

-- ============================= students ==============================
create policy students_select_personal on public.students
  for select to authenticated
  using (personal_id = (select auth.uid()) and (select private.is_personal()));

create policy students_select_self on public.students
  for select to authenticated
  using (user_id = (select auth.uid()) and status <> 'arquivado');

create policy students_insert_personal on public.students
  for insert to authenticated
  with check (
    personal_id = (select auth.uid())
    and (select private.is_personal())
    and status = 'convidado'
    and user_id is null
    and anonymized_at is null
  );

create policy students_update_personal on public.students
  for update to authenticated
  using (personal_id = (select auth.uid()) and (select private.is_personal()))
  with check (personal_id = (select auth.uid()) and (select private.is_personal()));

create policy students_update_self on public.students
  for update to authenticated
  using (user_id = (select auth.uid()) and status <> 'arquivado')
  with check (user_id = (select auth.uid()));   -- colunas liberadas: ver students_guard

-- Só apaga aluno que nunca ativou a conta. Os demais: arquivar/anonimizar.
create policy students_delete_personal on public.students
  for delete to authenticated
  using (
    personal_id = (select auth.uid())
    and (select private.is_personal())
    and status = 'convidado'
    and user_id is null
  );

-- ======================= student_private_notes =======================
create policy student_notes_personal_all on public.student_private_notes
  for all to authenticated
  using (personal_id = (select auth.uid()) and private.is_personal_of_student(student_id))
  with check (personal_id = (select auth.uid()) and private.is_personal_of_student(student_id));
-- Aluno: sem policy = sem acesso.

-- ========================== student_invites ==========================
create policy student_invites_select_personal on public.student_invites
  for select to authenticated
  using (private.is_personal_of_student(student_id));
-- Criar/revogar/consumir convites: somente servidor (service_role).

-- ============================= consents ==============================
create policy consents_select on public.consents
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_personal_of_student(student_id));

create policy consents_insert on public.consents
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      (student_id is null and (select private.is_personal()))
      or student_id = (select private.my_student_id_any())
    )
  );

create policy consents_update_revoke on public.consents
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));   -- só a coluna revoked_at é atualizável (GRANT)

-- ============================ anamneses ==============================
create policy anamneses_select on public.anamneses
  for select to authenticated
  using (private.is_personal_of_student(student_id) or private.is_own_student(student_id));

create policy anamneses_insert on public.anamneses
  for insert to authenticated
  with check (
    (private.is_personal_of_student(student_id) or private.is_own_student(student_id))
    and (filled_by is null or filled_by = (select auth.uid()))
  );

-- Aluno edita só enquanto não assinada; Personal sempre.
create policy anamneses_update on public.anamneses
  for update to authenticated
  using (
    private.is_personal_of_student(student_id)
    or (private.is_own_student(student_id) and signed_at is null)
  )
  with check (private.is_personal_of_student(student_id) or private.is_own_student(student_id));

-- ====================== muscle_groups / equipment ====================
create policy muscle_groups_select on public.muscle_groups
  for select to authenticated
  using ((select private.user_role()) is not null);

create policy equipment_select on public.equipment
  for select to authenticated
  using ((select private.user_role()) is not null);
-- Escrita: somente service_role / migrações.

-- ============================= exercises =============================
create policy exercises_select on public.exercises
  for select to authenticated
  using (private.can_view_exercise(id));

create policy exercises_insert on public.exercises
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select private.is_personal()));

create policy exercises_update on public.exercises
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select private.is_personal()))
  with check (owner_id = (select auth.uid()) and (select private.is_personal()));

create policy exercises_delete on public.exercises
  for delete to authenticated
  using (owner_id = (select auth.uid()) and (select private.is_personal()));

-- ======================= exercise_muscle_groups ======================
create policy exercise_mg_select on public.exercise_muscle_groups
  for select to authenticated
  using (private.can_view_exercise(exercise_id));

create policy exercise_mg_write on public.exercise_muscle_groups
  for all to authenticated
  using (private.owns_exercise(exercise_id))
  with check (private.owns_exercise(exercise_id));

-- =========================== exercise_media ==========================
create policy exercise_media_select on public.exercise_media
  for select to authenticated
  using (private.can_view_exercise(exercise_id));

create policy exercise_media_write on public.exercise_media
  for all to authenticated
  using (private.owns_exercise(exercise_id))
  with check (private.owns_exercise(exercise_id));

-- =========================== workout_plans ===========================
create policy plans_select_personal on public.workout_plans
  for select to authenticated
  using (personal_id = (select auth.uid()) and (select private.is_personal()));

create policy plans_select_aluno on public.workout_plans
  for select to authenticated
  using (private.is_student_of_plan(id));

create policy plans_insert on public.workout_plans
  for insert to authenticated
  with check (
    personal_id = (select auth.uid())
    and (select private.is_personal())
    and (student_id is null or private.is_personal_of_student(student_id))
  );

create policy plans_update on public.workout_plans
  for update to authenticated
  using (personal_id = (select auth.uid()) and (select private.is_personal()))
  with check (
    personal_id = (select auth.uid())
    and (select private.is_personal())
    and (student_id is null or private.is_personal_of_student(student_id))
  );

-- Só rascunhos e modelos podem ser apagados; planos usados são arquivados (preserva histórico)
create policy plans_delete on public.workout_plans
  for delete to authenticated
  using (
    personal_id = (select auth.uid())
    and (select private.is_personal())
    and (is_template or status = 'rascunho')
  );

-- ============================= workouts ==============================
create policy workouts_select on public.workouts
  for select to authenticated
  using (private.is_personal_of_plan(plan_id) or private.is_student_of_plan(plan_id));

create policy workouts_write on public.workouts
  for all to authenticated
  using (private.is_personal_of_plan(plan_id))
  with check (private.is_personal_of_plan(plan_id));

-- ========================= workout_exercises =========================
create policy workout_exercises_select on public.workout_exercises
  for select to authenticated
  using (private.is_personal_of_workout(workout_id) or private.is_student_of_workout(workout_id));

create policy workout_exercises_write on public.workout_exercises
  for all to authenticated
  using (private.is_personal_of_workout(workout_id))
  with check (private.is_personal_of_workout(workout_id) and private.can_view_exercise(exercise_id));

-- ========================== workout_sessions =========================
create policy sessions_select on public.workout_sessions
  for select to authenticated
  using (
    student_id = (select private.my_student_id())
    or private.is_personal_of_student(student_id)
  );

create policy sessions_insert_aluno on public.workout_sessions
  for insert to authenticated
  with check (
    student_id = (select private.my_student_id())
    and (workout_id is null or private.is_student_of_workout(workout_id))
  );

create policy sessions_update_aluno on public.workout_sessions
  for update to authenticated
  using (student_id = (select private.my_student_id()))
  with check (
    student_id = (select private.my_student_id())
    and (workout_id is null or private.is_student_of_workout(workout_id))
  );

create policy sessions_delete_aluno on public.workout_sessions
  for delete to authenticated
  using (student_id = (select private.my_student_id()) and status <> 'concluida');

-- ============================= set_logs ==============================
create policy set_logs_select on public.set_logs
  for select to authenticated
  using (private.is_own_session(session_id) or private.is_personal_of_session(session_id));

create policy set_logs_write_aluno on public.set_logs
  for all to authenticated
  using (private.is_own_session(session_id))
  with check (private.is_own_session(session_id));

-- ========================= assessment_metrics ========================
create policy metrics_select on public.assessment_metrics
  for select to authenticated
  using (
    (select private.user_role()) is not null
    and (
      owner_id is null
      or owner_id = (select auth.uid())
      or owner_id = (select private.my_personal_id())
    )
  );

create policy metrics_insert on public.assessment_metrics
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select private.is_personal()));

create policy metrics_update on public.assessment_metrics
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select private.is_personal()))
  with check (owner_id = (select auth.uid()) and (select private.is_personal()));

create policy metrics_delete on public.assessment_metrics
  for delete to authenticated
  using (owner_id = (select auth.uid()) and (select private.is_personal()));

-- ======================== assessment_protocols =======================
create policy protocols_select on public.assessment_protocols
  for select to authenticated
  using (private.can_view_protocol(id));

create policy protocols_insert on public.assessment_protocols
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select private.is_personal()));

create policy protocols_update on public.assessment_protocols
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select private.is_personal()))
  with check (owner_id = (select auth.uid()) and (select private.is_personal()));

create policy protocols_delete on public.assessment_protocols
  for delete to authenticated
  using (owner_id = (select auth.uid()) and (select private.is_personal()));

-- ===================== assessment_protocol_metrics ===================
create policy protocol_metrics_select on public.assessment_protocol_metrics
  for select to authenticated
  using (private.can_view_protocol(protocol_id));

create policy protocol_metrics_write on public.assessment_protocol_metrics
  for all to authenticated
  using (private.owns_protocol(protocol_id))
  with check (
    private.owns_protocol(protocol_id)
    and exists (select 1 from public.assessment_metrics m where m.id = metric_id)  -- RLS filtra métricas visíveis
  );

-- ============================ assessments ============================
create policy assessments_select on public.assessments
  for select to authenticated
  using (private.is_personal_of_student(student_id) or private.is_own_student(student_id));

create policy assessments_insert on public.assessments
  for insert to authenticated
  with check (
    personal_id = (select auth.uid())
    and private.is_personal_of_student(student_id)
    and (protocol_id is null or private.can_view_protocol(protocol_id))
  );

create policy assessments_update on public.assessments
  for update to authenticated
  using (private.is_personal_of_student(student_id))
  with check (
    personal_id = (select auth.uid())
    and private.is_personal_of_student(student_id)
    and (protocol_id is null or private.can_view_protocol(protocol_id))
  );

create policy assessments_delete on public.assessments
  for delete to authenticated
  using (private.is_personal_of_student(student_id));

-- ========================= assessment_values =========================
create policy assessment_values_select on public.assessment_values
  for select to authenticated
  using (private.can_access_assessment(assessment_id));

create policy assessment_values_write on public.assessment_values
  for all to authenticated
  using (private.is_personal_of_assessment(assessment_id))
  with check (
    private.is_personal_of_assessment(assessment_id)
    and exists (select 1 from public.assessment_metrics m where m.id = metric_id)
  );

-- ======================== progress_photo_sets ========================
create policy photo_sets_select on public.progress_photo_sets
  for select to authenticated
  using (private.can_view_photos(student_id));

create policy photo_sets_insert on public.progress_photo_sets
  for insert to authenticated
  with check (
    private.can_add_photos(student_id)
    and (created_by is null or created_by = (select auth.uid()))
  );

create policy photo_sets_update on public.progress_photo_sets
  for update to authenticated
  using (private.can_view_photos(student_id))
  with check (private.can_add_photos(student_id));

create policy photo_sets_delete on public.progress_photo_sets
  for delete to authenticated
  using (private.is_own_student(student_id));

-- ========================== progress_photos ==========================
create policy photos_select on public.progress_photos
  for select to authenticated
  using (private.can_view_photos(student_id));

create policy photos_insert on public.progress_photos
  for insert to authenticated
  with check (private.can_add_photos(student_id));

create policy photos_delete on public.progress_photos
  for delete to authenticated
  using (private.is_own_student(student_id));
-- (a exclusão do ARQUIVO no Storage é feita pelo app, ver 04_storage.sql)

-- ========================== weekly_checkins ==========================
create policy checkins_select on public.weekly_checkins
  for select to authenticated
  using (private.is_own_student(student_id) or private.is_personal_of_student(student_id));

create policy checkins_insert_aluno on public.weekly_checkins
  for insert to authenticated
  with check (
    private.is_own_student(student_id)
    and personal_reply is null
    and replied_at is null
    and replied_by is null
  );

create policy checkins_update on public.weekly_checkins
  for update to authenticated
  using (private.is_own_student(student_id) or private.is_personal_of_student(student_id))
  with check (private.is_own_student(student_id) or private.is_personal_of_student(student_id));
-- (quem pode alterar quais colunas: trigger checkins_guard)

-- ========================== conversations ============================
create policy conversations_select on public.conversations
  for select to authenticated
  using (private.is_conversation_participant(id));
-- Conversas são criadas por trigger ao cadastrar o aluno. Sem INSERT/UPDATE/DELETE pelo cliente.

-- ============================= messages ==============================
create policy messages_select on public.messages
  for select to authenticated
  using (private.is_conversation_participant(conversation_id));

create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and type in ('texto', 'imagem', 'audio')
    and private.can_post_in_conversation(conversation_id)
  );

create policy messages_soft_delete_own on public.messages
  for update to authenticated
  using (sender_id = (select auth.uid()) and private.is_conversation_participant(conversation_id))
  with check (sender_id = (select auth.uid()));

-- ======================== conversation_reads =========================
create policy conv_reads_select on public.conversation_reads
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy conv_reads_insert on public.conversation_reads
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_conversation_participant(conversation_id));

create policy conv_reads_update on public.conversation_reads
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.is_conversation_participant(conversation_id));

-- =========================== notifications ===========================
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));   -- só read_at (GRANT por coluna)

create policy notifications_delete_own on public.notifications
  for delete to authenticated
  using (user_id = (select auth.uid()));
-- INSERT: apenas triggers/service_role.

-- ====================== notification_preferences =====================
create policy notif_prefs_own on public.notification_preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ========================= push_subscriptions ========================
create policy push_subs_own on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ============================ audit_logs =============================
create policy audit_select_personal on public.audit_logs
  for select to authenticated
  using (personal_id = (select auth.uid()) and (select private.is_personal()));
-- INSERT: somente pela função public.log_audit() ou service_role. Aluno não lê.
