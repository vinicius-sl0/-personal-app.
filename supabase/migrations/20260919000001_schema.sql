-- =====================================================================
-- 01_schema.sql  |  Plataforma Personal Trainer
-- Enums, tabelas, chaves, constraints e índices.
--
-- Rode em um projeto NOVO/VAZIO. O SQL Editor executa o script inteiro
-- em uma única transação: se der erro, NADA é criado e você pode
-- corrigir e rodar de novo.
-- =====================================================================

-- Schema privado: funções auxiliares de segurança (NÃO exposto pela API)
create schema if not exists private;
comment on schema private is 'Funcoes auxiliares de seguranca (RLS). Nao exposta pela API do Supabase.';

-- =====================================================================
-- ENUMS
-- =====================================================================
create type public.user_role           as enum ('personal', 'aluno');
create type public.student_status      as enum ('convidado', 'ativo', 'pausado', 'arquivado');
create type public.sex_type            as enum ('masculino', 'feminino', 'outro', 'nao_informado');
create type public.consent_type        as enum ('termos_uso', 'politica_privacidade', 'dados_saude',
                                                'fotos_evolucao', 'responsavel_legal', 'uso_imagem_marketing');
create type public.difficulty_level    as enum ('iniciante', 'intermediario', 'avancado');
create type public.media_kind          as enum ('video', 'imagem');
create type public.media_source        as enum ('upload', 'youtube', 'vimeo', 'stream', 'externo');
create type public.plan_status         as enum ('rascunho', 'ativo', 'encerrado', 'arquivado');
create type public.session_status      as enum ('em_andamento', 'concluida', 'abandonada');
create type public.metric_category     as enum ('antropometria', 'circunferencia', 'dobra_cutanea',
                                                'composicao_corporal', 'desempenho', 'outro');
create type public.metric_value_type   as enum ('numeric', 'text');
create type public.photo_angle         as enum ('frente', 'costas', 'lado_esquerdo', 'lado_direito', 'outro');
create type public.message_type        as enum ('texto', 'imagem', 'audio', 'sistema');
create type public.notification_type   as enum ('nova_mensagem', 'treino_atribuido', 'avaliacao_registrada',
                                                'checkin_pendente', 'checkin_recebido', 'checkin_respondido',
                                                'lembrete', 'sistema');
create type public.notification_channel as enum ('in_app', 'email', 'push');

-- =====================================================================
-- 1. IDENTIDADE
-- =====================================================================

-- Um perfil por usuário do Supabase Auth. O PAPEL (role) é definido no
-- servidor (trigger/SQL) e o usuário NÃO consegue alterá-lo (ver 03_rls).
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null,
  full_name   text not null,
  email       text not null,
  phone       text,
  avatar_path text,
  timezone    text not null default 'America/Sao_Paulo',
  locale      text not null default 'pt-BR',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_email_key      unique (email),
  constraint profiles_email_lower_ck check (email = lower(email)),
  constraint profiles_name_ck        check (char_length(btrim(full_name)) between 2 and 120),
  constraint profiles_phone_ck       check (phone is null or phone ~ '^[0-9+() .-]{8,20}$')
);
comment on table public.profiles is 'Perfil de cada usuario autenticado. Sem perfil = sem acesso a nada.';

create table public.personal_profiles (
  profile_id    uuid primary key references public.profiles (id) on delete cascade,
  cref          text,
  bio           text,
  business_name text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Aluno: cadastro feito pelo Personal. user_id fica nulo até o aluno ativar a conta pelo convite.
create table public.students (
  id                      uuid primary key default gen_random_uuid(),
  personal_id             uuid not null references public.profiles (id) on delete restrict,
  user_id                 uuid unique references public.profiles (id) on delete set null,
  full_name               text not null,
  email                   text not null,
  phone                   text,
  status                  public.student_status not null default 'convidado',
  birth_date              date,
  sex                     public.sex_type not null default 'nao_informado',
  goal                    text,
  start_date              date not null default current_date,
  emergency_contact_name  text,
  emergency_contact_phone text,
  guardian_name           text,
  guardian_email          text,
  guardian_phone          text,
  archived_at             timestamptz,
  anonymized_at           timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint students_name_ck   check (char_length(btrim(full_name)) between 2 and 120),
  constraint students_email_ck  check (email = lower(email) and email like '%_@_%'),
  constraint students_phone_ck  check (phone is null or phone ~ '^[0-9+() .-]{8,20}$'),
  constraint students_birth_ck  check (birth_date is null or birth_date >= date '1900-01-01')
);
create unique index students_personal_email_uk on public.students (personal_id, email) where anonymized_at is null;
create index students_personal_status_idx on public.students (personal_id, status);
create index students_personal_name_idx   on public.students (personal_id, lower(full_name));

-- Notas privadas do Personal (tabela separada: RLS é por linha, não por coluna).
create table public.student_private_notes (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students (id) on delete cascade,
  personal_id uuid not null references public.profiles (id) on delete restrict,
  note        text not null check (char_length(btrim(note)) between 1 and 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index student_private_notes_student_idx on public.student_private_notes (student_id, created_at desc);

-- Convites: só o HASH do token é guardado. Criação/consumo feitos pelo servidor (service_role).
create table public.student_invites (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students (id) on delete cascade,
  token_hash  text not null,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at  timestamptz,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint student_invites_token_uk unique (token_hash)
);
create index student_invites_student_idx on public.student_invites (student_id);

-- Consentimentos LGPD (versionados, revogáveis, nunca apagados).
create table public.consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  student_id  uuid references public.students (id) on delete cascade,
  type        public.consent_type not null,
  version     text not null check (char_length(version) between 1 and 30),
  accepted_at timestamptz not null default now(),
  revoked_at  timestamptz,
  ip          inet,
  user_agent  text check (user_agent is null or char_length(user_agent) <= 500),
  created_at  timestamptz not null default now(),
  constraint consents_revoked_ck check (revoked_at is null or revoked_at >= accepted_at)
);
create unique index consents_active_uk on public.consents (user_id, type, version) where revoked_at is null;
create index consents_student_type_idx on public.consents (student_id, type) where revoked_at is null;
create index consents_user_idx         on public.consents (user_id);

-- Anamnese / PAR-Q (uma linha por versão preenchida).
create table public.anamneses (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students (id) on delete cascade,
  version         int not null default 1 check (version > 0),
  answers         jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  parq_has_alert  boolean not null default false,
  injuries        text,
  medications     text,
  conditions      text,
  filled_by       uuid references public.profiles (id) on delete set null,
  signed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint anamneses_student_version_uk unique (student_id, version)
);

-- =====================================================================
-- 2. EXERCÍCIOS
-- =====================================================================
create table public.muscle_groups (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z][a-z0-9_]{1,40}$'),
  name       text not null,
  sort_order int  not null default 0
);

create table public.equipment (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z][a-z0-9_]{1,40}$'),
  name       text not null,
  sort_order int  not null default 0
);

-- owner_id nulo = exercício global (mantido por você via SQL/service_role).
create table public.exercises (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid references public.profiles (id) on delete restrict,
  name                    text not null check (char_length(btrim(name)) between 2 and 150),
  description             text,
  instructions            text,
  primary_muscle_group_id uuid references public.muscle_groups (id) on delete set null,
  equipment_id            uuid references public.equipment (id) on delete set null,
  difficulty              public.difficulty_level not null default 'iniciante',
  is_archived             boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create unique index exercises_owner_name_uk on public.exercises
  (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name)) where not is_archived;
create index exercises_owner_idx  on public.exercises (owner_id);
create index exercises_muscle_idx on public.exercises (primary_muscle_group_id);
create index exercises_equip_idx  on public.exercises (equipment_id);

create table public.exercise_muscle_groups (
  exercise_id     uuid not null references public.exercises (id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups (id) on delete cascade,
  primary key (exercise_id, muscle_group_id)
);
create index exercise_muscle_groups_mg_idx on public.exercise_muscle_groups (muscle_group_id);

create table public.exercise_media (
  id               uuid primary key default gen_random_uuid(),
  exercise_id      uuid not null references public.exercises (id) on delete cascade,
  kind             public.media_kind not null default 'video',
  source           public.media_source not null,
  url              text,
  storage_path     text,
  thumbnail_path   text,
  title            text,
  duration_seconds int check (duration_seconds is null or duration_seconds between 1 and 3600),
  position         int not null default 0,
  created_at       timestamptz not null default now(),
  constraint exercise_media_source_ck check (
    (source = 'upload' and storage_path is not null)
    or (source <> 'upload' and url is not null and url ~* '^https://')
  )
);
create index exercise_media_exercise_idx on public.exercise_media (exercise_id, position);

-- =====================================================================
-- 3. TREINOS (PRESCRIÇÃO)
-- =====================================================================
create table public.workout_plans (
  id             uuid primary key default gen_random_uuid(),
  personal_id    uuid not null references public.profiles (id) on delete restrict,
  student_id     uuid references public.students (id) on delete cascade,
  is_template    boolean not null default false,
  name           text not null check (char_length(btrim(name)) between 2 and 150),
  objective      text,
  notes          text,
  start_date     date,
  end_date       date,
  status         public.plan_status not null default 'rascunho',
  version        int not null default 1 check (version > 0),
  parent_plan_id uuid references public.workout_plans (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint workout_plans_template_ck check (
    (is_template and student_id is null) or (not is_template and student_id is not null)
  ),
  constraint workout_plans_dates_ck check (end_date is null or start_date is null or end_date >= start_date)
);
create index workout_plans_personal_idx on public.workout_plans (personal_id, is_template, status);
create index workout_plans_student_idx  on public.workout_plans (student_id, status);
create index workout_plans_parent_idx   on public.workout_plans (parent_plan_id);
-- No máximo UM plano ativo por aluno
create unique index workout_plans_one_active_uk on public.workout_plans (student_id)
  where status = 'ativo' and not is_template;

create table public.workouts (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.workout_plans (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  position    int not null default 0,
  weekday_hint smallint check (weekday_hint between 0 and 6),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint workouts_plan_position_uk unique (plan_id, position) deferrable initially deferred
);

create table public.workout_exercises (
  id             uuid primary key default gen_random_uuid(),
  workout_id     uuid not null references public.workouts (id) on delete cascade,
  exercise_id    uuid not null references public.exercises (id) on delete restrict,
  position       int not null default 0,
  superset_group smallint,
  sets           int not null default 3 check (sets between 1 and 50),
  reps_min       int check (reps_min between 1 and 1000),
  reps_max       int check (reps_max between 1 and 1000),
  reps_text      text,
  target_load_kg numeric(7,2) check (target_load_kg >= 0),
  rest_seconds   int check (rest_seconds between 0 and 3600),
  tempo          text,
  rpe_target     numeric(3,1) check (rpe_target between 1 and 10),
  technique      text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint workout_exercises_reps_ck check (reps_max is null or reps_min is null or reps_max >= reps_min),
  constraint workout_exercises_position_uk unique (workout_id, position) deferrable initially deferred
);
create index workout_exercises_exercise_idx on public.workout_exercises (exercise_id);

-- =====================================================================
-- 4. EXECUÇÃO DO TREINO
-- =====================================================================
create table public.workout_sessions (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references public.students (id) on delete cascade,
  workout_id            uuid references public.workouts (id) on delete set null,
  plan_id               uuid references public.workout_plans (id) on delete set null,
  workout_name_snapshot text not null,
  client_uuid           uuid,  -- idempotência para envio offline
  started_at            timestamptz not null default now(),
  finished_at           timestamptz,
  perceived_effort      smallint check (perceived_effort between 1 and 10),
  notes                 text,
  status                public.session_status not null default 'em_andamento',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint workout_sessions_dates_ck check (finished_at is null or finished_at >= started_at),
  constraint workout_sessions_client_uk unique (student_id, client_uuid)
);
create index workout_sessions_student_idx on public.workout_sessions (student_id, started_at desc);
create index workout_sessions_workout_idx on public.workout_sessions (workout_id);
create index workout_sessions_plan_idx    on public.workout_sessions (plan_id);

create table public.set_logs (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid not null references public.workout_sessions (id) on delete cascade,
  workout_exercise_id   uuid references public.workout_exercises (id) on delete set null,
  exercise_id           uuid references public.exercises (id) on delete set null,
  exercise_name_snapshot text not null,
  set_number            int not null check (set_number between 1 and 100),
  reps_done             int check (reps_done between 0 and 1000),
  load_kg               numeric(7,2) check (load_kg >= 0),
  rpe                   numeric(3,1) check (rpe between 1 and 10),
  completed             boolean not null default true,
  prescribed_snapshot   jsonb,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint set_logs_set_uk unique (session_id, workout_exercise_id, set_number)
);
create index set_logs_session_idx   on public.set_logs (session_id);
create index set_logs_exercise_idx  on public.set_logs (exercise_id, created_at desc);
create index set_logs_wex_idx       on public.set_logs (workout_exercise_id);

-- =====================================================================
-- 5. AVALIAÇÕES (CATÁLOGO FLEXÍVEL DE MÉTRICAS)
-- =====================================================================
create table public.assessment_metrics (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references public.profiles (id) on delete restrict,   -- nulo = global
  key          text not null check (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  label        text not null,
  unit         text,
  category     public.metric_category not null default 'outro',
  value_type   public.metric_value_type not null default 'numeric',
  min_value    numeric,
  max_value    numeric,
  decimals     smallint not null default 1 check (decimals between 0 and 4),
  is_calculated boolean not null default false,
  formula_key  text,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint assessment_metrics_range_ck check (min_value is null or max_value is null or min_value <= max_value),
  constraint assessment_metrics_formula_ck check (not is_calculated or formula_key is not null)
);
create unique index assessment_metrics_owner_key_uk on public.assessment_metrics
  (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), key);
create index assessment_metrics_cat_idx on public.assessment_metrics (category, sort_order);

create table public.assessment_protocols (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references public.profiles (id) on delete restrict,   -- nulo = global
  name        text not null check (char_length(btrim(name)) between 2 and 100),
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index assessment_protocols_owner_name_uk on public.assessment_protocols
  (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table public.assessment_protocol_metrics (
  protocol_id uuid not null references public.assessment_protocols (id) on delete cascade,
  metric_id   uuid not null references public.assessment_metrics (id) on delete cascade,
  position    int not null default 0,
  required    boolean not null default false,
  primary key (protocol_id, metric_id)
);
create index assessment_protocol_metrics_metric_idx on public.assessment_protocol_metrics (metric_id);

create table public.assessments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students (id) on delete cascade,
  personal_id uuid not null references public.profiles (id) on delete restrict,
  protocol_id uuid references public.assessment_protocols (id) on delete set null,
  assessed_at date not null default current_date,
  method      text,
  device      text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index assessments_student_idx  on public.assessments (student_id, assessed_at desc);
create index assessments_personal_idx on public.assessments (personal_id);
create index assessments_protocol_idx on public.assessments (protocol_id);

create table public.assessment_values (
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  metric_id     uuid not null references public.assessment_metrics (id) on delete restrict,
  value_numeric numeric(14,4),
  value_text    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (assessment_id, metric_id),
  constraint assessment_values_any_ck check (value_numeric is not null or value_text is not null)
);
create index assessment_values_metric_idx on public.assessment_values (metric_id);

-- Série temporal para os gráficos. security_invoker = respeita a RLS de quem consulta.
create view public.v_student_metric_series with (security_invoker = true) as
select a.student_id,
       a.id          as assessment_id,
       a.assessed_at,
       m.id          as metric_id,
       m.key         as metric_key,
       m.label       as metric_label,
       m.unit,
       m.category,
       v.value_numeric
from public.assessment_values v
join public.assessments a        on a.id = v.assessment_id
join public.assessment_metrics m on m.id = v.metric_id
where v.value_numeric is not null;

-- =====================================================================
-- 6. FOTOS DE EVOLUÇÃO (arquivos ficam no Storage, bucket privado)
-- =====================================================================
create table public.progress_photo_sets (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students (id) on delete cascade,
  assessment_id uuid references public.assessments (id) on delete set null,
  taken_at      date not null default current_date,
  notes         text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint progress_photo_sets_id_student_uk unique (id, student_id)
);
create index progress_photo_sets_student_idx    on public.progress_photo_sets (student_id, taken_at desc);
create index progress_photo_sets_assessment_idx on public.progress_photo_sets (assessment_id);

create table public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  set_id       uuid not null,
  student_id   uuid not null,
  angle        public.photo_angle not null,
  storage_path text not null,
  thumb_path   text,
  width        int check (width > 0),
  height       int check (height > 0),
  size_bytes   int check (size_bytes > 0 and size_bytes <= 10485760),
  mime_type    text not null default 'image/webp' check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  created_at   timestamptz not null default now(),
  constraint progress_photos_set_fk foreign key (set_id, student_id)
    references public.progress_photo_sets (id, student_id) on delete cascade,
  constraint progress_photos_path_uk unique (storage_path),
  -- convenção: o 1º segmento do caminho é o student_id (as políticas do Storage dependem disso)
  constraint progress_photos_path_ck check (storage_path like (student_id::text || '/%'))
);
create index progress_photos_set_idx     on public.progress_photos (set_id);
create index progress_photos_student_idx on public.progress_photos (student_id);
create unique index progress_photos_set_angle_uk on public.progress_photos (set_id, angle) where angle <> 'outro';

-- =====================================================================
-- 7. CHECK-IN SEMANAL
-- =====================================================================
create table public.weekly_checkins (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students (id) on delete cascade,
  week_start      date not null check (extract(isodow from week_start) = 1),  -- segunda-feira
  sleep_quality   smallint check (sleep_quality between 1 and 5),
  energy          smallint check (energy between 1 and 5),
  stress          smallint check (stress between 1 and 5),
  diet_adherence  smallint check (diet_adherence between 1 and 5),
  trainings_done  smallint check (trainings_done between 0 and 14),
  pain_notes      text,
  comment         text,
  submitted_at    timestamptz not null default now(),
  personal_reply  text,
  replied_at      timestamptz,
  replied_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint weekly_checkins_student_week_uk unique (student_id, week_start)
);
create index weekly_checkins_student_idx on public.weekly_checkins (student_id, week_start desc);
create index weekly_checkins_pending_idx on public.weekly_checkins (student_id) where replied_at is null;

-- =====================================================================
-- 8. CHAT
-- =====================================================================
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  personal_id     uuid not null references public.profiles (id) on delete restrict,
  student_id      uuid not null references public.students (id) on delete cascade,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  constraint conversations_student_uk unique (student_id)
);
create index conversations_personal_idx on public.conversations (personal_id, last_message_at desc);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid references public.profiles (id) on delete set null,
  type            public.message_type not null default 'texto',
  body            text check (body is null or char_length(body) <= 4000),
  attachment_path text,
  reply_to_id     uuid references public.messages (id) on delete set null,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  constraint messages_content_ck check (
    deleted_at is not null
    or (type = 'texto'  and nullif(btrim(body), '') is not null)
    or (type = 'imagem' and attachment_path is not null)
    or (type = 'audio'  and attachment_path is not null)
    or (type = 'sistema')
  )
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc);
create index messages_sender_idx       on public.messages (sender_id);
create index messages_reply_idx        on public.messages (reply_to_id);

create table public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_reads_user_idx on public.conversation_reads (user_id);

-- =====================================================================
-- 9. NOTIFICAÇÕES
-- =====================================================================
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null,
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,
  url        text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx   on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

create table public.notification_preferences (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null,
  channel    public.notification_channel not null,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, type, channel)
);

create table public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  endpoint     text not null,
  p256dh       text not null,
  auth_key     text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  constraint push_subscriptions_endpoint_uk unique (endpoint)
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- =====================================================================
-- 10. AUDITORIA (somente inserção; sem FKs para sobreviver à exclusão de usuários)
-- =====================================================================
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  personal_id uuid,
  student_id  uuid,
  action      text not null,
  entity      text,
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  ip          inet,
  created_at  timestamptz not null default now()
);
create index audit_logs_personal_idx on public.audit_logs (personal_id, created_at desc);
create index audit_logs_student_idx  on public.audit_logs (student_id, created_at desc);
create index audit_logs_actor_idx    on public.audit_logs (actor_id);
