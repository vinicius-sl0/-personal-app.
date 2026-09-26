-- =====================================================================
-- 20260925000001_volume_config.sql  |  Plataforma Personal Trainer
--
-- Configuração da ANÁLISE DE VOLUME: quanto uma série conta para os
-- grupos musculares SECUNDÁRIOS de um exercício.
--   0    = não conta (só o grupo principal recebe a série)
--   0.5  = meia série (padrão)
--   1    = série inteira
--
-- O cálculo do volume em si NÃO precisa de tabela nova: usa o que já existe
--   exercises.primary_muscle_group_id  -> grupo principal
--   exercise_muscle_groups             -> grupos secundários
--   workout_exercises (sets, reps_min, reps_max, reps_text, target_load_kg) -> planejado
--   set_logs (reps_done, load_kg) + workout_sessions (data, aluno)           -> realizado
--
-- Se no futuro cada vínculo secundário precisar de um peso próprio, basta
-- uma coluna opcional em exercise_muscle_groups (ex.: "contribution") —
-- o app já calcula tudo em um único lugar (src/lib/volume.ts).
--
-- Pode ser rodado mais de uma vez sem problema. Depois rode de novo o scripts/08_testes_permissoes.sql.
-- =====================================================================

alter table public.personal_profiles
  add column if not exists secondary_muscle_weight numeric(3,2) not null default 0.5;

-- (drop + add: pode rodar de novo sem erro de "already exists")
alter table public.personal_profiles drop constraint if exists personal_profiles_secondary_weight_ck;
alter table public.personal_profiles
  add constraint personal_profiles_secondary_weight_ck
  check (secondary_muscle_weight >= 0 and secondary_muscle_weight <= 1);

comment on column public.personal_profiles.secondary_muscle_weight is
  'Análise de volume: quanto 1 série vale para cada grupo muscular secundário (0 = não conta, 0.5 = meia, 1 = inteira).';

-- Só o próprio Personal altera (a policy personal_profiles_update_self já restringe a linha).
grant update (secondary_muscle_weight) on public.personal_profiles to authenticated;
