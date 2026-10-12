-- =====================================================================
-- 20261012000001_observacao_por_serie.sql  |  Plataforma Personal Trainer
--
-- OBSERVAÇÃO INDIVIDUAL POR SÉRIE na ficha de treino.
--
-- Cada exercício da ficha é UMA linha de workout_exercises com o número de séries (`sets`);
-- as séries não são linhas próprias. Por isso as observações ficam numa lista na mesma linha:
--   set_notes[1] = observação da série 1, set_notes[2] = da série 2, ...
--   (texto vazio = série sem observação; a coluna inteira NULL = nenhuma observação).
--
-- Compatível com o que já existe: coluna nova, opcional, começa NULL em todas as fichas.
-- Permissões: as mesmas da linha (a regra workout_exercises_write só deixa o Personal da ficha
-- escrever; o aluno só lê a própria ficha) — nada novo para liberar.
-- =====================================================================

alter table public.workout_exercises add column if not exists set_notes text[];

comment on column public.workout_exercises.set_notes is
  'Observação de cada série: set_notes[1] = série 1, set_notes[2] = série 2... (NULL = sem observação).';

-- Cada observação com até 300 caracteres (função própria: CHECK não aceita subconsulta).
create or replace function private.set_notes_ok(p_notes text[])
returns boolean
language sql immutable set search_path = ''
as $$
  select coalesce(bool_and(n is null or char_length(n) <= 300), true) from unnest(p_notes) as n
$$;

-- Nunca mais observações do que séries.
alter table public.workout_exercises drop constraint if exists workout_exercises_set_notes_ck;
alter table public.workout_exercises
  add constraint workout_exercises_set_notes_ck
  check (set_notes is null or (cardinality(set_notes) <= sets and private.set_notes_ok(set_notes)));
