-- =====================================================================
-- 02_funcoes_triggers.sql  |  Plataforma Personal Trainer
-- Funções auxiliares (usadas pelas policies), triggers e regras de negócio
-- que o banco garante sozinho. Rode DEPOIS do 01_schema.sql.
-- =====================================================================

grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- FUNÇÕES AUXILIARES DE IDENTIDADE (SECURITY DEFINER = ignoram a RLS
-- internamente, o que evita recursão infinita nas policies)
-- ---------------------------------------------------------------------
create or replace function private.user_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
$$;

create or replace function private.is_personal()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select private.user_role()) = 'personal'::public.user_role, false)
$$;

create or replace function private.is_aluno()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select private.user_role()) = 'aluno'::public.user_role, false)
$$;

-- students.id do aluno logado, SOMENTE se ativo/pausado (acesso pleno aos dados)
create or replace function private.my_student_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select s.id
  from public.students s
  where s.user_id = (select auth.uid())
    and s.status in ('ativo', 'pausado')
    and s.anonymized_at is null
$$;

-- students.id do aluno logado em qualquer status exceto arquivado
-- (usado no fluxo de consentimento, quando o aluno ainda está "convidado")
create or replace function private.my_student_id_any()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select s.id
  from public.students s
  where s.user_id = (select auth.uid())
    and s.status <> 'arquivado'
    and s.anonymized_at is null
$$;

-- profiles.id do Personal responsável pelo aluno logado
create or replace function private.my_personal_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select s.personal_id
  from public.students s
  where s.user_id = (select auth.uid())
    and s.status <> 'arquivado'
    and s.anonymized_at is null
$$;

create or replace function private.is_personal_of_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and s.personal_id = (select auth.uid())
      and (select private.is_personal())
  )
$$;

create or replace function private.is_own_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(p_student_id = (select private.my_student_id()), false)
$$;

create or replace function private.can_access_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_personal_of_student(p_student_id) or private.is_own_student(p_student_id)
$$;

create or replace function private.is_personal_of_user(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.students s
    where s.user_id = p_user_id
      and s.personal_id = (select auth.uid())
      and (select private.is_personal())
  )
$$;

create or replace function private.can_view_profile(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    p_user_id = (select auth.uid())
    or p_user_id = (select private.my_personal_id())
    or (select private.is_personal_of_user(p_user_id)),
    false
  )
$$;

-- ---------------------------------------------------------------------
-- TREINOS
-- ---------------------------------------------------------------------
create or replace function private.is_personal_of_plan(p_plan_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_plans wp
    where wp.id = p_plan_id
      and wp.personal_id = (select auth.uid())
      and (select private.is_personal())
  )
$$;

-- O aluno só enxerga planos atribuídos a ele, não-modelo e já publicados (ativo/encerrado)
create or replace function private.is_student_of_plan(p_plan_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_plans wp
    where wp.id = p_plan_id
      and not wp.is_template
      and wp.status in ('ativo', 'encerrado')
      and wp.student_id = (select private.my_student_id())
  )
$$;

create or replace function private.is_personal_of_workout(p_workout_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.workouts w
    join public.workout_plans wp on wp.id = w.plan_id
    where w.id = p_workout_id
      and wp.personal_id = (select auth.uid())
      and (select private.is_personal())
  )
$$;

create or replace function private.is_student_of_workout(p_workout_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.workouts w
    join public.workout_plans wp on wp.id = w.plan_id
    where w.id = p_workout_id
      and not wp.is_template
      and wp.status in ('ativo', 'encerrado')
      and wp.student_id = (select private.my_student_id())
  )
$$;

create or replace function private.is_own_session(p_session_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_sessions ws
    where ws.id = p_session_id
      and ws.student_id = (select private.my_student_id())
  )
$$;

create or replace function private.is_personal_of_session(p_session_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_sessions ws
    join public.students s on s.id = ws.student_id
    where ws.id = p_session_id
      and s.personal_id = (select auth.uid())
      and (select private.is_personal())
  )
$$;

-- ---------------------------------------------------------------------
-- EXERCÍCIOS
-- ---------------------------------------------------------------------
create or replace function private.owns_exercise(p_exercise_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.exercises e
    where e.id = p_exercise_id
      and e.owner_id = (select auth.uid())
      and (select private.is_personal())
  )
$$;

-- Personal: globais + próprios. Aluno: só os exercícios dos treinos dele (e do histórico dele).
create or replace function private.can_view_exercise(p_exercise_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.exercises e
    where e.id = p_exercise_id
      and (
        (
          (select private.is_personal())
          and (e.owner_id is null or e.owner_id = (select auth.uid()))
        )
        or (
          (select private.is_aluno())
          and (
            exists (
              select 1
              from public.workout_exercises we
              join public.workouts w        on w.id = we.workout_id
              join public.workout_plans wp  on wp.id = w.plan_id
              where we.exercise_id = e.id
                and not wp.is_template
                and wp.status in ('ativo', 'encerrado')
                and wp.student_id = (select private.my_student_id())
            )
            or exists (
              select 1
              from public.set_logs sl
              join public.workout_sessions ws on ws.id = sl.session_id
              where sl.exercise_id = e.id
                and ws.student_id = (select private.my_student_id())
            )
          )
        )
      )
  )
$$;

-- ---------------------------------------------------------------------
-- AVALIAÇÕES
-- ---------------------------------------------------------------------
create or replace function private.owns_protocol(p_protocol_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.assessment_protocols ap
    where ap.id = p_protocol_id
      and ap.owner_id = (select auth.uid())
      and (select private.is_personal())
  )
$$;

create or replace function private.can_view_protocol(p_protocol_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.assessment_protocols ap
    where ap.id = p_protocol_id
      and (
        ap.owner_id is null
        or ap.owner_id = (select auth.uid())
        or ap.owner_id = (select private.my_personal_id())
      )
  )
$$;

create or replace function private.is_personal_of_assessment(p_assessment_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.assessments a
    join public.students s on s.id = a.student_id
    where a.id = p_assessment_id
      and s.personal_id = (select auth.uid())
      and (select private.is_personal())
  )
$$;

create or replace function private.can_access_assessment(p_assessment_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.assessments a
    where a.id = p_assessment_id
      and (private.is_personal_of_student(a.student_id) or private.is_own_student(a.student_id))
  )
$$;

-- ---------------------------------------------------------------------
-- CHAT
-- ---------------------------------------------------------------------
create or replace function private.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and (
        (c.personal_id = (select auth.uid()) and (select private.is_personal()))
        or c.student_id = (select private.my_student_id())
      )
  )
$$;

-- Só é possível enviar mensagem se o aluno tem conta e está ativo/pausado
create or replace function private.can_post_in_conversation(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    join public.students s on s.id = c.student_id
    where c.id = p_conversation_id
      and s.user_id is not null
      and s.status in ('ativo', 'pausado')
      and (
        (c.personal_id = (select auth.uid()) and (select private.is_personal()))
        or s.user_id = (select auth.uid())
      )
  )
$$;

-- ---------------------------------------------------------------------
-- CONSENTIMENTOS (LGPD)
-- ---------------------------------------------------------------------
create or replace function private.has_active_consent(p_student_id uuid, p_type public.consent_type)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.consents c
    where c.student_id = p_student_id
      and c.type = p_type
      and c.revoked_at is null
  )
$$;

-- Consentimentos obrigatórios para ativar o aluno (menores de 18 exigem o do responsável)
create or replace function private.required_consents_met(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    (
      select count(distinct c.type)
      from public.consents c
      where c.student_id = p_student_id
        and c.revoked_at is null
        and c.type in ('termos_uso', 'politica_privacidade', 'dados_saude')
    ) = 3
    and (
      not exists (
        select 1
        from public.students s
        where s.id = p_student_id
          and s.birth_date is not null
          and s.birth_date > (current_date - interval '18 years')::date
      )
      or exists (
        select 1
        from public.consents c
        where c.student_id = p_student_id
          and c.type = 'responsavel_legal'
          and c.revoked_at is null
      )
    )
$$;

-- ---------------------------------------------------------------------
-- FOTOS: o próprio aluno sempre vê as dele; o Personal só enquanto houver
-- consentimento ativo "fotos_evolucao". Enviar fotos também exige consentimento.
-- ---------------------------------------------------------------------
create or replace function private.can_view_photos(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_own_student(p_student_id)
      or (private.is_personal_of_student(p_student_id)
          and private.has_active_consent(p_student_id, 'fotos_evolucao'))
$$;

create or replace function private.can_add_photos(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (private.is_own_student(p_student_id) or private.is_personal_of_student(p_student_id))
     and private.has_active_consent(p_student_id, 'fotos_evolucao')
$$;

-- ---------------------------------------------------------------------
-- Leitura segura de segmentos do caminho no Storage (evita erro de cast de uuid)
-- ---------------------------------------------------------------------
create or replace function private.storage_uuid(p_name text, p_idx int)
returns uuid
language sql immutable set search_path = ''
as $$
  select case
    when p_idx < coalesce(array_length(string_to_array(p_name, '/'), 1), 0)
     and split_part(p_name, '/', p_idx) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', p_idx)::uuid
  end
$$;

-- ---------------------------------------------------------------------
-- NOTIFICAÇÕES (função interna: só triggers/service_role criam notificações)
-- ---------------------------------------------------------------------
create or replace function private.notify(
  p_user  uuid,
  p_type  public.notification_type,
  p_title text,
  p_body  text default null,
  p_data  jsonb default '{}'::jsonb,
  p_url   text default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_user is null then
    return;
  end if;
  -- respeita a preferência "notificação dentro do app desligada"
  if exists (
    select 1 from public.notification_preferences np
    where np.user_id = p_user and np.type = p_type and np.channel = 'in_app' and not np.enabled
  ) then
    return;
  end if;
  insert into public.notifications (user_id, type, title, body, data, url)
  values (p_user, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb), p_url);
end;
$$;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- updated_at em todas as tabelas que têm a coluna
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'personal_profiles', 'students', 'student_private_notes', 'anamneses',
    'exercises', 'workout_plans', 'workouts', 'workout_exercises', 'workout_sessions', 'set_logs',
    'assessment_metrics', 'assessment_protocols', 'assessments', 'assessment_values',
    'progress_photo_sets', 'weekly_checkins', 'notification_preferences'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function private.set_updated_at()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Criação do usuário ALUNO a partir do convite.
-- O servidor cria o usuário via Admin API com app_metadata:
--   { "role": "aluno", "student_id": "<uuid>" }
-- app_metadata SÓ pode ser definido pelo servidor (service_role); o usuário
-- não consegue forjar. Qualquer usuário sem esse metadado NÃO ganha perfil
-- e, portanto, não acessa nada. O Personal é criado manualmente (06_criar_personal.sql).
-- ---------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_role       text := new.raw_app_meta_data ->> 'role';
  v_student_id uuid;
  v_student    public.students%rowtype;
begin
  if v_role is distinct from 'aluno' then
    return new;
  end if;

  begin
    v_student_id := (new.raw_app_meta_data ->> 'student_id')::uuid;
  exception when others then
    raise exception 'Convite invalido: student_id ausente ou malformado';
  end;

  select * into v_student from public.students s where s.id = v_student_id for update;

  if not found
     or v_student.user_id is not null
     or v_student.status <> 'convidado'
     or v_student.anonymized_at is not null
     or v_student.email <> lower(new.email) then
    raise exception 'Convite invalido: aluno inexistente, ja vinculado ou e-mail diferente';
  end if;

  if not exists (
    select 1 from public.student_invites i
    where i.student_id = v_student_id
      and i.accepted_at is null
      and i.revoked_at is null
      and i.expires_at > now()
  ) then
    raise exception 'Convite invalido: expirado, revogado ou ja utilizado';
  end if;

  insert into public.profiles (id, role, full_name, email, phone)
  values (new.id, 'aluno', v_student.full_name, lower(new.email), v_student.phone);

  update public.students set user_id = new.id where id = v_student_id;

  update public.student_invites
     set accepted_at = now()
   where student_id = v_student_id and accepted_at is null and revoked_at is null;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------
-- Nome sincronizado entre profiles e students
-- ---------------------------------------------------------------------
create or replace function private.sync_profile_to_student()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.students
     set full_name = new.full_name
   where user_id = new.id and full_name is distinct from new.full_name;
  return null;
end;
$$;

create trigger profiles_sync_student
  after update of full_name on public.profiles
  for each row execute function private.sync_profile_to_student();

create or replace function private.sync_student_to_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.user_id is not null then
    update public.profiles
       set full_name = new.full_name
     where id = new.user_id and full_name is distinct from new.full_name;
  end if;
  return null;
end;
$$;

create trigger students_sync_profile
  after update of full_name on public.students
  for each row execute function private.sync_student_to_profile();

-- ---------------------------------------------------------------------
-- students: proteção de colunas + conversa criada automaticamente
-- (funções INVOKER: current_user é o papel real de quem executa)
-- ---------------------------------------------------------------------
create or replace function private.students_guard()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.personal_id is distinct from old.personal_id
     or new.user_id is distinct from old.user_id
     or new.anonymized_at is distinct from old.anonymized_at
     or new.created_at is distinct from old.created_at then
    raise exception 'Campos imutaveis: id, personal_id, user_id, anonymized_at, created_at'
      using errcode = '42501';
  end if;

  if (select private.is_personal()) then
    if old.user_id is not null and new.email is distinct from old.email then
      raise exception 'O e-mail nao pode ser alterado apos o aluno ativar a conta'
        using errcode = '42501';
    end if;
    if old.status = 'convidado' and new.status in ('ativo', 'pausado') then
      raise exception 'A ativacao ocorre automaticamente apos o aceite dos consentimentos'
        using errcode = '42501';
    end if;
    if new.status in ('ativo', 'pausado') and new.user_id is null then
      raise exception 'Aluno sem conta vinculada nao pode ficar ativo'
        using errcode = '42501';
    end if;
    if new.status = 'convidado' and old.status in ('ativo', 'pausado') then
      raise exception 'Transicao de status invalida'
        using errcode = '42501';
    end if;
  else
    -- aluno: só pode editar dados pessoais complementares
    if new.email is distinct from old.email
       or new.full_name is distinct from old.full_name
       or new.status is distinct from old.status
       or new.start_date is distinct from old.start_date
       or new.archived_at is distinct from old.archived_at then
      raise exception 'Alunos nao podem alterar nome, e-mail, status ou data de inicio'
        using errcode = '42501';
    end if;
  end if;

  if new.status = 'arquivado' and old.status <> 'arquivado' then
    new.archived_at := now();
  elsif new.status <> 'arquivado' then
    new.archived_at := null;
  end if;

  return new;
end;
$$;

create trigger students_guard
  before update on public.students
  for each row execute function private.students_guard();

create or replace function private.students_create_conversation()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.conversations (personal_id, student_id)
  values (new.personal_id, new.id)
  on conflict (student_id) do nothing;
  return null;
end;
$$;

create trigger students_after_insert
  after insert on public.students
  for each row execute function private.students_create_conversation();

-- ---------------------------------------------------------------------
-- consents: revogar é permitido; reativar não (registre novo aceite).
-- Ao completar os consentimentos obrigatórios, o aluno vira "ativo".
-- ---------------------------------------------------------------------
create or replace function private.consents_guard()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;
  if old.revoked_at is not null then
    new.revoked_at := old.revoked_at;   -- imutável depois de revogado
  elsif new.revoked_at is not null then
    new.revoked_at := now();            -- impede data retroativa
  end if;
  return new;
end;
$$;

create trigger consents_guard
  before update on public.consents
  for each row execute function private.consents_guard();

create or replace function private.consents_activate_student()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_personal uuid;
  v_name     text;
begin
  if new.student_id is null or new.revoked_at is not null then
    return null;
  end if;

  if private.required_consents_met(new.student_id) then
    update public.students
       set status = 'ativo'
     where id = new.student_id and status = 'convidado' and user_id is not null
    returning personal_id, full_name into v_personal, v_name;

    if found then
      perform private.notify(
        v_personal, 'sistema', 'Aluno ativou a conta',
        v_name || ' aceitou os termos e ja pode acessar a plataforma.',
        jsonb_build_object('student_id', new.student_id), null);
    end if;
  end if;
  return null;
end;
$$;

create trigger consents_after_insert
  after insert on public.consents
  for each row execute function private.consents_activate_student();

-- ---------------------------------------------------------------------
-- workout_plans: ao ativar um plano, o anterior do aluno é encerrado
-- ---------------------------------------------------------------------
create or replace function private.plans_before_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'ativo' and not new.is_template and new.student_id is not null
     and exists (select 1 from public.students s
                 where s.id = new.student_id and s.personal_id = new.personal_id) then
    if new.start_date is null then
      new.start_date := current_date;
    end if;
    update public.workout_plans
       set status = 'encerrado', end_date = coalesce(end_date, current_date)
     where student_id = new.student_id
       and status = 'ativo'
       and not is_template
       and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger plans_before_write
  before insert or update of status on public.workout_plans
  for each row execute function private.plans_before_write();

create or replace function private.plans_after_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_user      uuid;
  v_activated boolean;
begin
  if tg_op = 'INSERT' then
    v_activated := (new.status = 'ativo');
  else
    v_activated := (new.status = 'ativo' and old.status is distinct from 'ativo');
  end if;

  if v_activated and not new.is_template and new.student_id is not null then
    select s.user_id into v_user from public.students s where s.id = new.student_id;
    perform private.notify(
      v_user, 'treino_atribuido', 'Novo treino disponivel', new.name,
      jsonb_build_object('plan_id', new.id), null);
  end if;
  return null;
end;
$$;

create trigger plans_after_write
  after insert or update of status on public.workout_plans
  for each row execute function private.plans_after_write();

-- ---------------------------------------------------------------------
-- assessments: avisa o aluno
-- ---------------------------------------------------------------------
create or replace function private.assessments_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid;
begin
  select s.user_id into v_user from public.students s where s.id = new.student_id;
  perform private.notify(
    v_user, 'avaliacao_registrada', 'Nova avaliacao registrada', null,
    jsonb_build_object('assessment_id', new.id), null);
  return null;
end;
$$;

create trigger assessments_after_insert
  after insert on public.assessments
  for each row execute function private.assessments_notify();

-- ---------------------------------------------------------------------
-- weekly_checkins: aluno escreve, Personal só responde
-- ---------------------------------------------------------------------
create or replace function private.checkins_guard()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if new.student_id is distinct from old.student_id
     or new.week_start is distinct from old.week_start
     or new.created_at is distinct from old.created_at then
    raise exception 'student_id, week_start e created_at nao podem ser alterados'
      using errcode = '42501';
  end if;

  if (select private.is_personal()) then
    if (new.sleep_quality, new.energy, new.stress, new.diet_adherence,
        new.trainings_done, new.pain_notes, new.comment, new.submitted_at)
       is distinct from
       (old.sleep_quality, old.energy, old.stress, old.diet_adherence,
        old.trainings_done, old.pain_notes, old.comment, old.submitted_at) then
      raise exception 'O Personal so pode preencher a resposta do check-in'
        using errcode = '42501';
    end if;
    if new.personal_reply is distinct from old.personal_reply then
      new.replied_at := now();
      new.replied_by := (select auth.uid());
    else
      new.replied_at := old.replied_at;
      new.replied_by := old.replied_by;
    end if;
  else
    if new.personal_reply is distinct from old.personal_reply
       or new.replied_at is distinct from old.replied_at
       or new.replied_by is distinct from old.replied_by then
      raise exception 'O aluno nao pode alterar a resposta do Personal'
        using errcode = '42501';
    end if;
    if old.replied_at is not null then
      raise exception 'Check-in ja respondido nao pode mais ser editado'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger checkins_guard
  before update on public.weekly_checkins
  for each row execute function private.checkins_guard();

create or replace function private.checkins_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_personal uuid;
  v_user     uuid;
  v_name     text;
begin
  select s.personal_id, s.user_id, s.full_name
    into v_personal, v_user, v_name
    from public.students s where s.id = new.student_id;

  if tg_op = 'INSERT' then
    perform private.notify(
      v_personal, 'checkin_recebido', 'Novo check-in semanal', v_name,
      jsonb_build_object('student_id', new.student_id, 'checkin_id', new.id), null);
  elsif new.personal_reply is not null and new.personal_reply is distinct from old.personal_reply then
    perform private.notify(
      v_user, 'checkin_respondido', 'Seu Personal respondeu ao check-in', null,
      jsonb_build_object('checkin_id', new.id), null);
  end if;
  return null;
end;
$$;

create trigger checkins_after_write
  after insert or update on public.weekly_checkins
  for each row execute function private.checkins_notify();

-- ---------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------
create or replace function private.messages_before_insert()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.reply_to_id is not null and not exists (
    select 1 from public.messages m
    where m.id = new.reply_to_id and m.conversation_id = new.conversation_id
  ) then
    raise exception 'A mensagem respondida precisa pertencer a mesma conversa'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger messages_before_insert
  before insert on public.messages
  for each row execute function private.messages_before_insert();

create or replace function private.messages_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_personal     uuid;
  v_student_user uuid;
  v_recipient    uuid;
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;

  if new.type = 'sistema' then
    return null;
  end if;

  select c.personal_id, s.user_id
    into v_personal, v_student_user
    from public.conversations c
    join public.students s on s.id = c.student_id
   where c.id = new.conversation_id;

  if new.sender_id = v_personal then
    v_recipient := v_student_user;
  else
    v_recipient := v_personal;
  end if;

  if v_recipient is null then
    return null;
  end if;

  -- não empilha notificações: só cria se não houver uma não lida desta conversa
  if not exists (
    select 1 from public.notifications n
    where n.user_id = v_recipient
      and n.type = 'nova_mensagem'
      and n.read_at is null
      and n.data ->> 'conversation_id' = new.conversation_id::text
  ) then
    perform private.notify(
      v_recipient, 'nova_mensagem', 'Nova mensagem', null,
      jsonb_build_object('conversation_id', new.conversation_id), null);
  end if;
  return null;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function private.messages_after_insert();

-- Excluir mensagem = apagar o conteúdo (soft delete); não dá para restaurar
create or replace function private.messages_before_update()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;
  if new.deleted_at is not null and old.deleted_at is null then
    new.deleted_at      := now();
    new.body            := null;
    new.attachment_path := null;
  elsif new.deleted_at is null and old.deleted_at is not null then
    raise exception 'Mensagem excluida nao pode ser restaurada' using errcode = '42501';
  else
    new.deleted_at := old.deleted_at;
  end if;
  return new;
end;
$$;

create trigger messages_before_update
  before update on public.messages
  for each row execute function private.messages_before_update();

-- ---------------------------------------------------------------------
-- audit_logs: somente inserção
-- ---------------------------------------------------------------------
create or replace function private.audit_logs_immutable()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'audit_logs e somente insercao' using errcode = '42501';
end;
$$;

create trigger audit_logs_no_change
  before update or delete on public.audit_logs
  for each row execute function private.audit_logs_immutable();

create trigger audit_logs_no_truncate
  before truncate on public.audit_logs
  for each statement execute function private.audit_logs_immutable();

-- =====================================================================
-- RPC pública de auditoria (o app registra leituras/exportações sensíveis)
-- O ator é sempre o usuário logado; só registra sobre alunos aos quais ele tem acesso.
-- =====================================================================
create or replace function public.log_audit(
  p_action     text,
  p_entity     text default null,
  p_entity_id  uuid default null,
  p_student_id uuid default null,
  p_metadata   jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_personal uuid;
begin
  if v_uid is null then
    raise exception 'Nao autenticado' using errcode = '28000';
  end if;
  if p_student_id is not null and not private.can_access_student(p_student_id) then
    raise exception 'Sem acesso a este aluno' using errcode = '42501';
  end if;

  if private.is_personal() then
    v_personal := v_uid;
  else
    v_personal := private.my_personal_id();
  end if;

  insert into public.audit_logs (actor_id, personal_id, student_id, action, entity, entity_id, metadata)
  values (v_uid, v_personal, p_student_id, left(p_action, 100), left(p_entity, 100),
          p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.log_audit(text, text, uuid, uuid, jsonb) from public, anon;
grant execute on function public.log_audit(text, text, uuid, uuid, jsonb) to authenticated;

-- =====================================================================
-- Permissões de execução das funções do schema private
-- =====================================================================
revoke execute on all functions in schema private from public, anon;
grant  execute on all functions in schema private to authenticated, service_role;
-- funções internas que o cliente jamais deve chamar:
revoke execute on function private.notify(uuid, public.notification_type, text, text, jsonb, text) from authenticated;
revoke execute on function private.handle_new_user() from authenticated;

-- =====================================================================
-- Realtime: chat e notificações (a RLS continua valendo nos eventos)
-- =====================================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.messages;
    exception when duplicate_object or feature_not_supported then null;
    end;
    begin
      alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object or feature_not_supported then null;
    end;
  end if;
end;
$$;
