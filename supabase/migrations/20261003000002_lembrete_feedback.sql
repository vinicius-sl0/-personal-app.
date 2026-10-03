-- =====================================================================
-- 20261003000002_lembrete_feedback.sql  |  Plataforma Personal Trainer
--
-- LEMBRETE AUTOMÁTICO DO FEEDBACK SEMANAL.
--
-- O Personal escolhe (em Configurações) se o lembrete está ligado, o dia da semana e a hora
-- (padrão: sexta às 18h, horário de Brasília). Um agendamento do próprio banco (pg_cron) roda
-- a cada hora; quando bate o dia/hora escolhidos, cria o aviso "Feedback semanal pendente"
-- (tipo checkin_pendente) para cada aluno ATIVO que ainda não mandou o Feedback da semana.
-- O aviso aparece no sino e, para quem ativou, chega no celular (trigger de push já existente).
--
-- Garantias: no máximo 1 lembrete por aluno por semana (mesmo se o agendamento rodar duas vezes);
-- ao mandar o Feedback, o lembrete daquela semana é marcado como lido.
--
-- Depois de rodar: rode de novo o scripts/08_testes_permissoes.sql.
-- =====================================================================

create extension if not exists pg_cron;

-- ---------------------------------------------------------------------
-- Configuração (por Personal)
-- ---------------------------------------------------------------------
alter table public.personal_profiles
  add column if not exists feedback_reminder_enabled boolean  not null default true,
  add column if not exists feedback_reminder_dow     smallint not null default 5,   -- ISO: 1 = seg ... 7 = dom
  add column if not exists feedback_reminder_hour    smallint not null default 18;  -- 0 a 23, horário de Brasília

alter table public.personal_profiles drop constraint if exists personal_profiles_feedback_reminder_ck;
alter table public.personal_profiles
  add constraint personal_profiles_feedback_reminder_ck
  check (feedback_reminder_dow between 1 and 7 and feedback_reminder_hour between 0 and 23);

comment on column public.personal_profiles.feedback_reminder_enabled is 'Lembrete automático do Feedback semanal ligado.';
comment on column public.personal_profiles.feedback_reminder_dow is 'Dia do lembrete (ISO: 1 = segunda ... 7 = domingo).';
comment on column public.personal_profiles.feedback_reminder_hour is 'Hora do lembrete (0 a 23, America/Sao_Paulo).';

-- Só o próprio Personal altera (a policy personal_profiles_update_self já restringe a linha).
grant update (feedback_reminder_enabled, feedback_reminder_dow, feedback_reminder_hour)
  on public.personal_profiles to authenticated;

-- ---------------------------------------------------------------------
-- Envio dos lembretes (chamado pelo agendamento a cada hora)
-- ---------------------------------------------------------------------
create or replace function private.send_feedback_reminders(p_force boolean default false)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_now   timestamp := now() at time zone 'America/Sao_Paulo';
  v_today date      := (now() at time zone 'America/Sao_Paulo')::date;
  v_dow   int       := extract(isodow from v_now)::int;
  v_hour  int       := extract(hour from v_now)::int;
  v_week  date      := v_today - (extract(isodow from v_now)::int - 1);  -- segunda-feira desta semana
  v_sent  integer   := 0;
  r       record;
begin
  for r in
    select s.user_id
      from public.personal_profiles pp
      join public.students s on s.personal_id = pp.profile_id
     where pp.feedback_reminder_enabled
       and (p_force or (pp.feedback_reminder_dow = v_dow and pp.feedback_reminder_hour = v_hour))
       and s.status = 'ativo'
       and s.user_id is not null
       and (s.start_date is null or s.start_date <= v_today)
       and not exists (
         select 1 from public.weekly_checkins w where w.student_id = s.id and w.week_start = v_week
       )
       and not exists (
         select 1 from public.notifications n
          where n.user_id = s.user_id and n.type = 'checkin_pendente'
            and n.data ->> 'week_start' = v_week::text
       )
  loop
    perform private.notify(
      r.user_id, 'checkin_pendente', 'Feedback semanal pendente',
      'Conte como foi sua semana. Leva 1 minuto.',
      jsonb_build_object('week_start', v_week), '/aluno/feedback');
    v_sent := v_sent + 1;
  end loop;
  return v_sent;
end;
$$;

revoke execute on function private.send_feedback_reminders(boolean) from public, anon, authenticated;

-- Mandou o Feedback: o lembrete daquela semana vira "lido".
create or replace function private.weekly_checkins_clear_reminder()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.notifications n
     set read_at = now()
    from public.students s
   where s.id = new.student_id
     and n.user_id = s.user_id
     and n.type = 'checkin_pendente'
     and n.read_at is null
     and n.data ->> 'week_start' = new.week_start::text;
  return null;
end;
$$;

revoke execute on function private.weekly_checkins_clear_reminder() from public, anon, authenticated;

drop trigger if exists weekly_checkins_clear_reminder on public.weekly_checkins;
create trigger weekly_checkins_clear_reminder
  after insert on public.weekly_checkins
  for each row execute function private.weekly_checkins_clear_reminder();

-- ---------------------------------------------------------------------
-- Agendamento: todo início de hora (o horário escolhido é conferido dentro da função).
-- Pode rodar a migração de novo: o agendamento antigo é trocado.
-- ---------------------------------------------------------------------
do $$
begin
  perform cron.unschedule(j.jobid) from cron.job j where j.jobname = 'lembrete-feedback-semanal';
  perform cron.schedule('lembrete-feedback-semanal', '0 * * * *', 'select private.send_feedback_reminders()');
end
$$;
