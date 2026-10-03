-- =====================================================================
-- 20261003000003_lembretes_treino.sql  |  Plataforma Personal Trainer
--
-- DOIS AVISOS AUTOMÁTICOS (rodam pelo pg_cron, já ligado pela migração 20261003000002):
--
-- 1. LEMBRETE DE TREINO (para o aluno): nos dias de treino combinados
--    (students.training_days), na hora que o PRÓPRIO aluno escolhe no Perfil (padrão 17h,
--    horário de Brasília), quem ainda não fez o check-in do dia recebe "Hoje é dia de treino".
--    O aluno pode desligar. No máximo 1 por dia.
--
-- 2. AVISO DE FALTAS (para o Personal): quando um aluno falta a N dias combinados seguidos
--    (mesma regra da Frequência: dia combinado, já passado, sem nenhum treino registrado),
--    o Personal recebe um aviso. N e ligar/desligar ficam em Configurações (padrão 2).
--    Um aviso por sequência de faltas (não repete a cada dia). Conferido todo dia às 9h.
--
-- Os dois usam o tipo de aviso 'lembrete' (já existente) com data.kind = 'treino' | 'faltas';
-- o push para o celular vai junto pelo trigger já existente.
-- Depois de rodar: rode de novo o scripts/08_testes_permissoes.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Preferência do ALUNO (no perfil: cada pessoa altera só o próprio)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists training_reminder_enabled boolean  not null default true,
  add column if not exists training_reminder_hour    smallint not null default 17;

alter table public.profiles drop constraint if exists profiles_training_reminder_ck;
alter table public.profiles
  add constraint profiles_training_reminder_ck check (training_reminder_hour between 0 and 23);

comment on column public.profiles.training_reminder_enabled is 'Aluno: lembrete "Hoje é dia de treino" ligado.';
comment on column public.profiles.training_reminder_hour is 'Aluno: hora do lembrete de treino (0 a 23, America/Sao_Paulo).';

grant update (training_reminder_enabled, training_reminder_hour) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- Preferência do PERSONAL (aviso de faltas)
-- ---------------------------------------------------------------------
alter table public.personal_profiles
  add column if not exists absence_alert_enabled boolean  not null default true,
  add column if not exists absence_alert_days    smallint not null default 2;

alter table public.personal_profiles drop constraint if exists personal_profiles_absence_alert_ck;
alter table public.personal_profiles
  add constraint personal_profiles_absence_alert_ck check (absence_alert_days between 1 and 7);

comment on column public.personal_profiles.absence_alert_enabled is 'Aviso quando um aluno falta a dias combinados seguidos.';
comment on column public.personal_profiles.absence_alert_days is 'Quantas faltas seguidas (em dias combinados) disparam o aviso.';

grant update (absence_alert_enabled, absence_alert_days) on public.personal_profiles to authenticated;

-- ---------------------------------------------------------------------
-- 1. Lembrete de treino (a cada hora; cada aluno tem a sua hora)
-- ---------------------------------------------------------------------
create or replace function private.send_training_reminders(p_force boolean default false)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_now   timestamp := now() at time zone 'America/Sao_Paulo';
  v_today date      := (now() at time zone 'America/Sao_Paulo')::date;
  v_dow   smallint  := extract(isodow from v_now)::smallint;
  v_hour  int       := extract(hour from v_now)::int;
  v_sent  integer   := 0;
  r       record;
begin
  for r in
    select s.id, s.user_id
      from public.students s
      join public.profiles p on p.id = s.user_id
     where s.status = 'ativo'
       and v_dow = any (s.training_days)
       and (s.start_date is null or s.start_date <= v_today)
       and p.training_reminder_enabled
       and (p_force or p.training_reminder_hour = v_hour)
       -- já fez o check-in hoje (treinando ou concluído)? então não precisa lembrar
       and not exists (
         select 1 from public.workout_sessions ws
          where ws.student_id = s.id
            and (ws.started_at at time zone 'America/Sao_Paulo')::date = v_today
       )
       and not exists (
         select 1 from public.notifications n
          where n.user_id = s.user_id and n.type = 'lembrete'
            and n.data ->> 'kind' = 'treino' and n.data ->> 'date' = v_today::text
       )
  loop
    perform private.notify(
      r.user_id, 'lembrete', 'Hoje é dia de treino',
      'Seu treino de hoje está esperando. Abra o app para fazer o check-in.',
      jsonb_build_object('kind', 'treino', 'date', v_today), '/aluno');
    v_sent := v_sent + 1;
  end loop;
  return v_sent;
end;
$$;

revoke execute on function private.send_training_reminders(boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Aviso de faltas seguidas (todo dia às 9h)
-- ---------------------------------------------------------------------
-- Sequência de faltas que termina no último dia combinado ANTES de hoje: conta para trás os
-- dias combinados sem nenhum treino, parando no primeiro dia com treino, no início do
-- acompanhamento (start_date) ou em 60 dias. Devolve o tamanho e o primeiro dia da sequência.
create or replace function private.absence_streak(p_student_id uuid, p_today date, out days int, out first_missed date)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_days  smallint[];
  v_start date;
  d       date;
begin
  days := 0;
  select s.training_days, s.start_date into v_days, v_start from public.students s where s.id = p_student_id;
  if v_days is null or cardinality(v_days) = 0 then
    return;
  end if;
  for i in 1..60 loop
    d := p_today - i;
    exit when v_start is not null and d < v_start;
    continue when not (extract(isodow from d)::smallint = any (v_days));
    exit when exists (
      select 1 from public.workout_sessions ws
       where ws.student_id = p_student_id
         and (ws.started_at at time zone 'America/Sao_Paulo')::date = d
    );
    days := days + 1;
    first_missed := d;
  end loop;
end;
$$;

revoke execute on function private.absence_streak(uuid, date) from public, anon, authenticated;

create or replace function private.send_absence_alerts(p_force boolean default false)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_now   timestamp := now() at time zone 'America/Sao_Paulo';
  v_today date      := (now() at time zone 'America/Sao_Paulo')::date;
  v_sent  integer   := 0;
  v_st    record;
  r       record;
begin
  if not p_force and extract(hour from v_now)::int <> 9 then
    return 0;
  end if;

  for r in
    select s.id, s.full_name, pp.profile_id as personal_id, pp.absence_alert_days as limit_days
      from public.students s
      join public.personal_profiles pp on pp.profile_id = s.personal_id
     where pp.absence_alert_enabled
       and s.status = 'ativo'
       and cardinality(s.training_days) > 0
  loop
    select * into v_st from private.absence_streak(r.id, v_today);
    continue when v_st.days < r.limit_days;
    -- um aviso por sequência (identificada pelo primeiro dia que faltou)
    continue when exists (
      select 1 from public.notifications n
       where n.user_id = r.personal_id and n.type = 'lembrete'
         and n.data ->> 'kind' = 'faltas'
         and n.data ->> 'student_id' = r.id::text
         and n.data ->> 'since' = v_st.first_missed::text
    );
    perform private.notify(
      r.personal_id, 'lembrete', 'Aluno faltando aos treinos',
      r.full_name || ' faltou a ' || v_st.days || ' dias de treino seguidos.',
      jsonb_build_object('kind', 'faltas', 'student_id', r.id, 'since', v_st.first_missed, 'days', v_st.days),
      '/personal/alunos/' || r.id || '/frequencia');
    v_sent := v_sent + 1;
  end loop;
  return v_sent;
end;
$$;

revoke execute on function private.send_absence_alerts(boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Agendamentos (todo início de hora; a hora certa é conferida dentro de cada função)
-- ---------------------------------------------------------------------
do $$
begin
  perform cron.unschedule(j.jobid) from cron.job j where j.jobname in ('lembrete-treino', 'aviso-faltas');
  perform cron.schedule('lembrete-treino', '0 * * * *', 'select private.send_training_reminders()');
  perform cron.schedule('aviso-faltas', '0 * * * *', 'select private.send_absence_alerts()');
end
$$;
