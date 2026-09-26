-- =====================================================================
-- 20260925000002_calorias_exercicio.sql  |  Plataforma Personal Trainer
--
-- CALORIAS ESTIMADAS (Análise de Volume de Treino):
-- cada exercício da biblioteca pode ter um gasto calórico MÉDIO estimado
-- por minuto (kcal/min). Fica em branco até o Personal preencher — o app
-- não inventa valores; exercício sem kcal/min fica fora da estimativa.
--
-- O tempo vem do que já é registrado na execução do treino:
--   workout_sessions.started_at (check-in) e finished_at (check-out)
--   set_logs (séries feitas de cada exercício na sessão)
-- Tempo estimado do exercício = duração do treino × (séries do exercício ÷ séries do treino)
-- Calorias estimadas = tempo estimado × kcal/min      (cálculo em src/lib/calories.ts)
--
-- Pode ser rodado mais de uma vez sem problema. Depois rode de novo o scripts/08_testes_permissoes.sql.
-- =====================================================================

alter table public.exercises
  add column if not exists kcal_per_min numeric(5,2);

-- (drop + add: pode rodar de novo sem erro de "already exists")
alter table public.exercises drop constraint if exists exercises_kcal_per_min_ck;
alter table public.exercises
  add constraint exercises_kcal_per_min_ck
  check (kcal_per_min is null or (kcal_per_min > 0 and kcal_per_min <= 30));

comment on column public.exercises.kcal_per_min is
  'Gasto calórico médio ESTIMADO por minuto (kcal/min), incluindo o descanso entre séries. Aproximação, não medição.';

-- (exercises já tem GRANT de update na tabela inteira e a RLS só deixa o dono alterar.)
