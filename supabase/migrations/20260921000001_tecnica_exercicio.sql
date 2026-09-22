-- =====================================================================
-- 20260921000001_tecnica_exercicio.sql  |  Plataforma Personal Trainer
--
-- Estrutura a "técnica" de cada exercício DENTRO DA FICHA (não no cadastro
-- do exercício, porque o mesmo exercício pode ser normal para um aluno e
-- drop set para outro): Normal, Drop set, Bi-set, Rest-pause.
--
-- Seguro rodar: converte a coluna existente (technique, hoje texto livre
-- e sem uso real) para um enum, e adiciona technique_detail para guardar
-- a explicação específica de cada técnica (ex.: as cargas do drop set).
-- Se algo falhar, nada é gravado (transação única do SQL Editor).
-- =====================================================================

create type public.exercise_technique as enum ('normal', 'dropset', 'biset', 'restpause');

-- Qualquer linha existente sem técnica definida vira "normal".
alter table public.workout_exercises
  alter column technique drop default,
  alter column technique type public.exercise_technique
    using (case when technique is null then 'normal' else 'normal' end)::public.exercise_technique,
  alter column technique set default 'normal',
  alter column technique set not null;

alter table public.workout_exercises
  add column if not exists technique_detail text;

alter table public.workout_exercises
  add constraint workout_exercises_technique_detail_ck
  check (technique = 'normal' or nullif(btrim(technique_detail), '') is not null);

comment on column public.workout_exercises.technique is
  'Técnica de execução prescrita para este exercício, nesta ficha (normal, dropset, biset, restpause).';
comment on column public.workout_exercises.technique_detail is
  'Explicação específica da técnica (ex.: cargas do drop set, exercício combinado do bi-set, padrão do rest-pause). Obrigatório quando technique <> normal.';
