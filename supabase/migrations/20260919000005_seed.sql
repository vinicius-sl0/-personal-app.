-- =====================================================================
-- 05_seed.sql  |  Plataforma Personal Trainer
-- Dados iniciais GLOBAIS (owner_id nulo): visíveis para todos, editáveis só por você
-- (SQL Editor / service_role). O Personal cria os dele por cima destes.
-- Pode ser rodado mais de uma vez (ignora o que já existe).
-- =====================================================================

-- ----------------------------- grupos musculares ---------------------
insert into public.muscle_groups (slug, name, sort_order) values
  ('peito',            'Peito',               10),
  ('costas',           'Costas',              20),
  ('ombros',           'Ombros',              30),
  ('biceps',           'Bíceps',              40),
  ('triceps',          'Tríceps',             50),
  ('antebraco',        'Antebraço',           60),
  ('abdomen',          'Abdômen',             70),
  ('lombar',           'Lombar',              80),
  ('gluteos',          'Glúteos',             90),
  ('quadriceps',       'Quadríceps',         100),
  ('posteriores_coxa', 'Posteriores de coxa',110),
  ('panturrilhas',     'Panturrilhas',       120),
  ('trapezio',         'Trapézio',           130),
  ('corpo_inteiro',    'Corpo inteiro',      140),
  ('cardio',           'Cardio',             150)
on conflict (slug) do nothing;

-- ------------------------------ equipamentos -------------------------
insert into public.equipment (slug, name, sort_order) values
  ('peso_corporal', 'Peso corporal',  10),
  ('halteres',      'Halteres',       20),
  ('barra',         'Barra',          30),
  ('maquina',       'Máquina',        40),
  ('cabos_polia',   'Cabos / Polia',  50),
  ('barra_fixa',    'Barra fixa',     60),
  ('kettlebell',    'Kettlebell',     70),
  ('elastico',      'Elástico',       80),
  ('banco',         'Banco',          90),
  ('esteira',       'Esteira',       100),
  ('bicicleta',     'Bicicleta',     110)
on conflict (slug) do nothing;

-- ---------------------- catálogo de métricas de avaliação ------------
-- Novos indicadores no futuro = novas linhas aqui (sem migração de schema).
-- Valores calculados (is_calculated) são gravados pelo app como "foto" no momento da avaliação.
insert into public.assessment_metrics
  (owner_id, key, label, unit, category, min_value, max_value, decimals, is_calculated, formula_key, sort_order)
values
  -- Antropometria
  (null, 'weight_kg',        'Peso',                     'kg',    'antropometria',   20,   400, 2, false, null,    10),
  (null, 'height_cm',        'Altura',                   'cm',    'antropometria',  100,   250, 1, false, null,    20),
  (null, 'bmi',              'IMC',                      'kg/m²', 'antropometria',    5,    80, 2, true,  'bmi',    30),
  (null, 'waist_hip_ratio',  'Relação cintura-quadril',  null,    'antropometria',  0.4,   1.6, 2, true,  'whr',    40),

  -- Circunferências (cm)
  (null, 'circ_neck',                 'Pescoço',                   'cm', 'circunferencia', 15, 80,  1, false, null, 110),
  (null, 'circ_shoulder',             'Ombro',                     'cm', 'circunferencia', 60, 200, 1, false, null, 120),
  (null, 'circ_chest',                'Tórax',                     'cm', 'circunferencia', 50, 200, 1, false, null, 130),
  (null, 'circ_waist',                'Cintura',                   'cm', 'circunferencia', 40, 200, 1, false, null, 140),
  (null, 'circ_abdomen',              'Abdômen',                   'cm', 'circunferencia', 40, 200, 1, false, null, 150),
  (null, 'circ_hip',                  'Quadril',                   'cm', 'circunferencia', 50, 200, 1, false, null, 160),
  (null, 'circ_arm_right_relaxed',    'Braço direito relaxado',    'cm', 'circunferencia', 10, 80,  1, false, null, 170),
  (null, 'circ_arm_left_relaxed',     'Braço esquerdo relaxado',   'cm', 'circunferencia', 10, 80,  1, false, null, 180),
  (null, 'circ_arm_right_contracted', 'Braço direito contraído',   'cm', 'circunferencia', 10, 80,  1, false, null, 190),
  (null, 'circ_arm_left_contracted',  'Braço esquerdo contraído',  'cm', 'circunferencia', 10, 80,  1, false, null, 200),
  (null, 'circ_forearm_right',        'Antebraço direito',         'cm', 'circunferencia', 10, 60,  1, false, null, 210),
  (null, 'circ_forearm_left',         'Antebraço esquerdo',        'cm', 'circunferencia', 10, 60,  1, false, null, 220),
  (null, 'circ_thigh_right',          'Coxa direita',              'cm', 'circunferencia', 20, 120, 1, false, null, 230),
  (null, 'circ_thigh_left',           'Coxa esquerda',             'cm', 'circunferencia', 20, 120, 1, false, null, 240),
  (null, 'circ_calf_right',           'Panturrilha direita',       'cm', 'circunferencia', 15, 80,  1, false, null, 250),
  (null, 'circ_calf_left',            'Panturrilha esquerda',      'cm', 'circunferencia', 15, 80,  1, false, null, 260),

  -- Dobras cutâneas (mm)
  (null, 'skinfold_triceps',      'Dobra tricipital',       'mm', 'dobra_cutanea', 1, 80, 1, false, null, 310),
  (null, 'skinfold_biceps',       'Dobra bicipital',        'mm', 'dobra_cutanea', 1, 80, 1, false, null, 320),
  (null, 'skinfold_subscapular',  'Dobra subescapular',     'mm', 'dobra_cutanea', 1, 80, 1, false, null, 330),
  (null, 'skinfold_suprailiac',   'Dobra suprailíaca',      'mm', 'dobra_cutanea', 1, 80, 1, false, null, 340),
  (null, 'skinfold_abdominal',    'Dobra abdominal',        'mm', 'dobra_cutanea', 1, 80, 1, false, null, 350),
  (null, 'skinfold_thigh',        'Dobra da coxa',          'mm', 'dobra_cutanea', 1, 80, 1, false, null, 360),
  (null, 'skinfold_chest',        'Dobra peitoral',         'mm', 'dobra_cutanea', 1, 80, 1, false, null, 370),
  (null, 'skinfold_midaxillary',  'Dobra axilar média',     'mm', 'dobra_cutanea', 1, 80, 1, false, null, 380),
  (null, 'skinfold_calf',         'Dobra da panturrilha',   'mm', 'dobra_cutanea', 1, 80, 1, false, null, 390),

  -- Composição corporal
  (null, 'body_fat_pct',       'Percentual de gordura',   '%',    'composicao_corporal',   2,   70,   1, false, null,        410),
  (null, 'fat_mass_kg',        'Massa de gordura',        'kg',   'composicao_corporal',   0,  300,   2, true,  'fat_mass',  420),
  (null, 'lean_mass_kg',       'Massa magra',             'kg',   'composicao_corporal',   0,  250,   2, true,  'lean_mass', 430),
  (null, 'muscle_mass_kg',     'Massa muscular',          'kg',   'composicao_corporal',   0,  200,   2, false, null,        440),
  (null, 'muscle_mass_pct',    'Massa muscular (%)',      '%',    'composicao_corporal',   0,  100,   1, false, null,        450),
  (null, 'visceral_fat_level', 'Gordura visceral (nível)', null,  'composicao_corporal',   1,   59,   0, false, null,        460),
  (null, 'body_water_pct',     'Água corporal',           '%',    'composicao_corporal',  20,   80,   1, false, null,        470),
  (null, 'bone_mass_kg',       'Massa óssea',             'kg',   'composicao_corporal',   0,   10,   2, false, null,        480),
  (null, 'bmr_kcal',           'Taxa metabólica basal',   'kcal', 'composicao_corporal', 500, 6000,   0, false, null,        490),
  (null, 'metabolic_age',      'Idade metabólica',        'anos', 'composicao_corporal',  10,  100,   0, false, null,        500),

  -- Outros indicadores
  (null, 'resting_hr_bpm',     'Frequência cardíaca de repouso', 'bpm',  'outro',  20, 220, 0, false, null, 610),
  (null, 'bp_systolic_mmhg',   'Pressão sistólica',              'mmHg', 'outro',  60, 260, 0, false, null, 620),
  (null, 'bp_diastolic_mmhg',  'Pressão diastólica',             'mmHg', 'outro',  30, 160, 0, false, null, 630)
on conflict do nothing;

-- ------------------------------- protocolos --------------------------
insert into public.assessment_protocols (owner_id, name, description) values
  (null, 'Antropometria básica', 'Peso, altura, IMC, cintura, quadril e relação cintura-quadril'),
  (null, 'Bioimpedância',        'Composição corporal medida por balança/aparelho de bioimpedância'),
  (null, 'Circunferências',      'Todas as medidas de perímetro corporal'),
  (null, 'Dobras cutâneas',      'Dobras medidas com adipômetro, junto com o peso')
on conflict do nothing;

insert into public.assessment_protocol_metrics (protocol_id, metric_id, position, required)
select p.id, m.id, x.pos, x.req
from (values
  ('Antropometria básica', 'weight_kg',       1, true),
  ('Antropometria básica', 'height_cm',       2, true),
  ('Antropometria básica', 'bmi',             3, false),
  ('Antropometria básica', 'circ_waist',      4, false),
  ('Antropometria básica', 'circ_hip',        5, false),
  ('Antropometria básica', 'waist_hip_ratio', 6, false),
  ('Bioimpedância',        'weight_kg',          1, true),
  ('Bioimpedância',        'body_fat_pct',       2, true),
  ('Bioimpedância',        'fat_mass_kg',        3, false),
  ('Bioimpedância',        'lean_mass_kg',       4, false),
  ('Bioimpedância',        'muscle_mass_kg',     5, false),
  ('Bioimpedância',        'visceral_fat_level', 6, false),
  ('Bioimpedância',        'body_water_pct',     7, false),
  ('Bioimpedância',        'bmr_kcal',           8, false),
  ('Dobras cutâneas',      'weight_kg',          0, false)
) as x(protocol_name, metric_key, pos, req)
join public.assessment_protocols p on p.owner_id is null and p.name = x.protocol_name
join public.assessment_metrics   m on m.owner_id is null and m.key  = x.metric_key
on conflict do nothing;

-- Circunferências e Dobras: todas as métricas da categoria correspondente
insert into public.assessment_protocol_metrics (protocol_id, metric_id, position, required)
select p.id, m.id, m.sort_order, false
from public.assessment_protocols p
join public.assessment_metrics m
  on m.owner_id is null and m.category = 'circunferencia'
where p.owner_id is null and p.name = 'Circunferências'
on conflict do nothing;

insert into public.assessment_protocol_metrics (protocol_id, metric_id, position, required)
select p.id, m.id, m.sort_order, false
from public.assessment_protocols p
join public.assessment_metrics m
  on m.owner_id is null and m.category = 'dobra_cutanea'
where p.owner_id is null and p.name = 'Dobras cutâneas'
on conflict do nothing;

-- ------------------ exercícios base (globais, sem vídeo) --------------
-- Ponto de partida. O Personal cadastra vídeos e os próprios exercícios.
insert into public.exercises (owner_id, name, description, primary_muscle_group_id, equipment_id, difficulty)
select null::uuid, x.name, x.descr, mg.id, eq.id, x.diff::public.difficulty_level
from (values
  ('Supino reto com barra',        'Empurre a barra do peito até estender os cotovelos, com controle.',       'peito',            'barra',         'intermediario'),
  ('Supino inclinado com halteres','Empurre os halteres em banco inclinado, com amplitude controlada.',       'peito',            'halteres',      'intermediario'),
  ('Flexão de braço',              'Com o corpo alinhado, desça o peito ao chão e empurre de volta.',          'peito',            'peso_corporal', 'iniciante'),
  ('Crucifixo na máquina',         'Junte as alças à frente do peito mantendo os cotovelos levemente flexionados.', 'peito',     'maquina',       'iniciante'),
  ('Puxada frontal',               'Puxe a barra até a altura do peito, levando os cotovelos para baixo.',    'costas',           'cabos_polia',   'iniciante'),
  ('Remada curvada com barra',     'Com o tronco inclinado, puxe a barra em direção ao abdômen.',             'costas',           'barra',         'intermediario'),
  ('Remada baixa no cabo',         'Sentado, puxe o triângulo em direção ao abdômen mantendo a coluna neutra.','costas',          'cabos_polia',   'iniciante'),
  ('Barra fixa',                   'Puxe o corpo até o queixo passar da barra, com controle na descida.',     'costas',           'barra_fixa',    'avancado'),
  ('Desenvolvimento com halteres', 'Empurre os halteres acima da cabeça a partir da altura dos ombros.',      'ombros',           'halteres',      'intermediario'),
  ('Elevação lateral',             'Eleve os halteres lateralmente até a altura dos ombros.',                 'ombros',           'halteres',      'iniciante'),
  ('Rosca direta com barra',       'Flexione os cotovelos levando a barra em direção aos ombros.',            'biceps',           'barra',         'iniciante'),
  ('Tríceps na polia',             'Estenda os cotovelos empurrando a barra/corda para baixo.',               'triceps',          'cabos_polia',   'iniciante'),
  ('Agachamento livre',            'Agache mantendo a coluna neutra e os joelhos alinhados aos pés.',         'quadriceps',       'barra',         'intermediario'),
  ('Leg press 45°',                'Empurre a plataforma estendendo os joelhos sem travá-los.',               'quadriceps',       'maquina',       'iniciante'),
  ('Cadeira extensora',            'Estenda os joelhos elevando a alavanca, com controle na volta.',          'quadriceps',       'maquina',       'iniciante'),
  ('Mesa flexora',                 'Flexione os joelhos levando o rolo em direção aos glúteos.',              'posteriores_coxa', 'maquina',       'iniciante'),
  ('Stiff com barra',              'Incline o tronco à frente com joelhos levemente flexionados e coluna neutra.', 'posteriores_coxa', 'barra',     'intermediario'),
  ('Elevação pélvica',             'Com as costas apoiadas no banco, eleve o quadril contraindo os glúteos.', 'gluteos',          'barra',         'intermediario'),
  ('Panturrilha em pé',            'Eleve os calcanhares o máximo possível e desça com controle.',            'panturrilhas',     'maquina',       'iniciante'),
  ('Prancha abdominal',            'Mantenha o corpo alinhado apoiado nos antebraços e pontas dos pés.',      'abdomen',          'peso_corporal', 'iniciante')
) as x(name, descr, mg_slug, eq_slug, diff)
join public.muscle_groups mg on mg.slug = x.mg_slug
join public.equipment     eq on eq.slug = x.eq_slug
on conflict do nothing;
