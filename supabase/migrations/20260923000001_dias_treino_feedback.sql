-- =====================================================================
-- 20260923000001_dias_treino_feedback.sql  |  Plataforma Personal Trainer
--
-- 1) Dias de treino combinados com cada aluno (students.training_days),
--    usados na "folha de ponto" (check-in/check-out diário) para saber
--    quando o aluno "não foi". Só o Personal altera; o aluno não.
-- 2) Novas perguntas do FEEDBACK SEMANAL (tabela weekly_checkins):
--    como se sentiu nos treinos, percepção de progresso e dificuldades.
--    As colunas antigas (sono, estresse, treinos feitos) continuam
--    existindo para não perder histórico, só deixam de ser perguntadas.
-- 3) Atualiza as travas (triggers) para cobrir as colunas novas:
--    - aluno NÃO altera os próprios dias de treino;
--    - Personal NÃO altera as respostas novas do feedback.
--
-- Seguro rodar uma vez. Se algo falhar, nada é gravado (transação única do
-- SQL Editor). Depois rode de novo o scripts/08_testes_permissoes.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Dias de treino (ISO: 1 = segunda ... 7 = domingo)
-- ---------------------------------------------------------------------
alter table public.students
  add column if not exists training_days smallint[] not null default '{}';

alter table public.students
  add constraint students_training_days_ck
  check (training_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[] and cardinality(training_days) <= 7);

comment on column public.students.training_days is
  'Dias da semana combinados para treinar (ISO: 1 = segunda ... 7 = domingo). Definido pelo Personal.';

-- ---------------------------------------------------------------------
-- 2. Feedback semanal: novas perguntas
-- ---------------------------------------------------------------------
alter table public.weekly_checkins
  add column if not exists training_feeling smallint check (training_feeling between 1 and 5),
  add column if not exists progress_feeling smallint check (progress_feeling between 1 and 5),
  add column if not exists difficulties     text     check (difficulties is null or char_length(difficulties) <= 1000);

comment on column public.weekly_checkins.training_feeling is 'Como o aluno se sentiu durante os treinos (1 a 5).';
comment on column public.weekly_checkins.progress_feeling is 'Como o aluno percebe o próprio progresso (1 a 5).';
comment on column public.weekly_checkins.difficulties     is 'Dificuldades relatadas pelo aluno na semana.';

-- ---------------------------------------------------------------------
-- 3a. students_guard: igual à versão anterior + aluno não altera training_days
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
       or new.archived_at is distinct from old.archived_at
       or new.training_days is distinct from old.training_days then
      raise exception 'Alunos nao podem alterar nome, e-mail, status, data de inicio ou dias de treino'
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

-- ---------------------------------------------------------------------
-- 3b. checkins_guard: igual à versão anterior + colunas novas protegidas
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
        new.trainings_done, new.pain_notes, new.comment, new.submitted_at,
        new.training_feeling, new.progress_feeling, new.difficulties)
       is distinct from
       (old.sleep_quality, old.energy, old.stress, old.diet_adherence,
        old.trainings_done, old.pain_notes, old.comment, old.submitted_at,
        old.training_feeling, old.progress_feeling, old.difficulties) then
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
