-- =====================================================================
-- 07_verificacao.sql  |  Plataforma Personal Trainer
-- Painel de conferência. É SOMENTE LEITURA (não altera nada).
-- Deve devolver uma tabela; a coluna "status" precisa estar "OK" (ou "info").
-- =====================================================================
select n, verificacao, resultado, esperado,
       case
         when esperado = '-'        then 'info'
         when resultado = esperado  then 'OK'
         else 'VERIFICAR'
       end as status
from (
  -- ----------------------------- ESTRUTURA -----------------------------
  select 1 as n, 'Tabelas no schema public' as verificacao,
         (select count(*) from pg_tables where schemaname = 'public')::text as resultado,
         '32' as esperado
  union all
  select 2, 'Tabelas esperadas que estão FALTANDO',
         (select count(*)
            from unnest(array[
              'profiles','personal_profiles','students','student_private_notes','student_invites',
              'consents','anamneses','muscle_groups','equipment','exercises','exercise_muscle_groups',
              'exercise_media','workout_plans','workouts','workout_exercises','workout_sessions',
              'set_logs','assessment_metrics','assessment_protocols','assessment_protocol_metrics',
              'assessments','assessment_values','progress_photo_sets','progress_photos',
              'weekly_checkins','conversations','messages','conversation_reads','notifications',
              'notification_preferences','push_subscriptions','audit_logs'
            ]) as t(tabela)
           where not exists (select 1 from pg_tables p
                              where p.schemaname = 'public' and p.tablename = t.tabela))::text,
         '0'
  union all
  select 3, 'Enums criados',
         (select count(*) from pg_type t join pg_namespace ns on ns.oid = t.typnamespace
           where ns.nspname = 'public' and t.typtype = 'e')::text,
         '15'
  union all
  select 4, 'Trigger de criação de aluno em auth.users',
         (select count(*) from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal)::text,
         '1'

  -- ------------------------------ SEGURANÇA ----------------------------
  union all
  select 10, 'Tabelas SEM RLS ativa',
         (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity)::text,
         '0'
  union all
  select 11, 'Tabelas com RLS mas SEM nenhuma policy',
         (select count(*) from pg_tables t
           where t.schemaname = 'public'
             and not exists (select 1 from pg_policies p
                              where p.schemaname = 'public' and p.tablename = t.tablename))::text,
         '0'
  union all
  select 12, 'Total de policies no schema public', 
         (select count(*) from pg_policies where schemaname = 'public')::text,
         '-'
  union all
  select 13, 'Policies liberadas para anon/public (deve ser zero)',
         (select count(*) from pg_policies
           where schemaname = 'public' and (roles::text[] && array['anon', 'public']))::text,
         '0'
  union all
  select 14, 'Privilégios do papel anon em tabelas públicas',
         (select count(*) from information_schema.role_table_grants
           where grantee = 'anon' and table_schema = 'public')::text,
         '0'
  union all
  select 15, 'authenticated pode INSERIR em notifications?',
         has_table_privilege('authenticated', 'public.notifications', 'INSERT')::text,
         'false'
  union all
  select 16, 'authenticated pode INSERIR em audit_logs?',
         has_table_privilege('authenticated', 'public.audit_logs', 'INSERT')::text,
         'false'
  union all
  select 17, 'authenticated pode ALTERAR profiles.role?',
         has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')::text,
         'false'
  union all
  select 18, 'authenticated pode LER student_private_notes? (RLS filtra aluno)',
         has_table_privilege('authenticated', 'public.student_private_notes', 'SELECT')::text,
         'true'
  union all
  select 19, 'Funções auxiliares no schema private',
         (select count(*) from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
           where ns.nspname = 'private')::text,
         '-'

  -- ------------------------------- STORAGE -----------------------------
  union all
  select 30, 'Buckets criados',
         (select count(*) from storage.buckets
           where id in ('progress-photos', 'chat-attachments', 'exercise-media', 'avatars'))::text,
         '4'
  union all
  select 31, 'Buckets PÚBLICOS entre eles (deve ser zero)',
         (select count(*) from storage.buckets
           where id in ('progress-photos', 'chat-attachments', 'exercise-media', 'avatars') and public)::text,
         '0'
  union all
  select 32, 'Policies de Storage (app_*)',
         (select count(*) from pg_policies where schemaname = 'storage' and policyname like 'app\_%')::text,
         '13'

  -- ------------------------------- REALTIME ----------------------------
  union all
  select 40, 'Tabelas no Realtime (messages, notifications)',
         (select count(*) from pg_publication_tables
           where pubname = 'supabase_realtime' and schemaname = 'public'
             and tablename in ('messages', 'notifications'))::text,
         '2'

  -- --------------------------------- SEED ------------------------------
  union all
  select 50, 'Grupos musculares',
         (select count(*) from public.muscle_groups)::text, '15'
  union all
  select 51, 'Equipamentos',
         (select count(*) from public.equipment)::text, '11'
  union all
  select 52, 'Métricas globais de avaliação',
         (select count(*) from public.assessment_metrics where owner_id is null)::text, '42'
  union all
  select 53, 'Protocolos globais de avaliação',
         (select count(*) from public.assessment_protocols where owner_id is null)::text, '4'
  union all
  select 54, 'Exercícios globais iniciais',
         (select count(*) from public.exercises where owner_id is null)::text, '20'

  -- -------------------------------- CONTAS -----------------------------
  union all
  select 60, 'Personal cadastrado (06_criar_personal.sql)',
         (select count(*) from public.profiles where role = 'personal')::text, '1'
) q
order by n;

-- ---------------------------------------------------------------------
-- CONSULTAS DE DETALHE (rode uma por vez, se quiser inspecionar)
-- ---------------------------------------------------------------------
-- Tabelas e RLS:
--   select tablename, rowsecurity as rls_ativa from pg_tables where schemaname = 'public' order by 1;
--
-- Todas as policies do banco (dados):
--   select tablename, policyname, cmd, roles, qual as using_expr, with_check
--     from pg_policies where schemaname = 'public' order by tablename, cmd, policyname;
--
-- Policies do Storage:
--   select policyname, cmd, qual, with_check from pg_policies
--    where schemaname = 'storage' and tablename = 'objects' order by policyname;
--
-- Quantidade de policies por tabela:
--   select tablename, count(*) from pg_policies where schemaname = 'public' group by 1 order by 1;
--
-- Chaves estrangeiras:
--   select conrelid::regclass as tabela, conname, pg_get_constraintdef(oid) as definicao
--     from pg_constraint where contype = 'f' and connamespace = 'public'::regnamespace order by 1, 2;
--
-- Triggers:
--   select event_object_table as tabela, trigger_name, action_timing, event_manipulation
--     from information_schema.triggers where trigger_schema in ('public','auth') order by 1, 2;
