-- =====================================================================
-- 08_testes_permissoes.sql  |  Plataforma Personal Trainer
--
-- Simula usuários reais (2 Personais, 4 alunos, usuário sem perfil, anônimo) e
-- tenta acessos permitidos E proibidos. Ao final devolve uma tabela:
--   status = OK      -> o comportamento foi o esperado
--   status = FALHOU  -> ha um problema de seguranca/regra: me envie a linha
--
-- SEGURO: tudo roda dentro de um bloco que é DESFEITO no final. Nenhum usuário,
-- aluno ou dado de teste permanece no banco. Não mexe nos seus dados reais.
-- Rode DEPOIS dos scripts 01 a 04 (o 05 é opcional).
-- =====================================================================

-- ---- ferramentas temporárias (somem ao fim da sessão) ----------------
create or replace function pg_temp.r(p_ok boolean, p_desc text, p_detail text default null)
returns jsonb
language sql
as $f$
  select jsonb_build_object('ok', coalesce(p_ok, false), 'desc', p_desc, 'detail', p_detail)
$f$;

-- Executa um SQL "como" um usuário do app (p_uid) ou como anônimo (p_uid nulo).
-- Devolve: n = valor da 1ª coluna do resultado (use count(*)), err = mensagem de erro (se houver).
create or replace function pg_temp.exec_as(p_uid uuid, p_sql text, out n bigint, out err text)
language plpgsql
as $f$
declare
  v_orig text := current_setting('test.orig_role');
begin
  execute format('set local role %I', v_orig);
  if p_uid is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claim.role', 'anon', true);
    execute 'set local role anon';
  else
    perform set_config('request.jwt.claims',
                       json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', p_uid::text, true);
    perform set_config('request.jwt.claim.role', 'authenticated', true);
    execute 'set local role authenticated';
  end if;

  begin
    execute p_sql into n;
  exception when others then
    n := null;
    err := sqlerrm;
  end;

  execute format('set local role %I', v_orig);
end;
$f$;

drop table if exists pg_temp.teste_resultado;
create temp table teste_resultado (n int, status text, teste text, detalhe text);

-- ---- os testes -------------------------------------------------------
do $test$
declare
  v_res  jsonb := '[]'::jsonb;
  v_step text  := 'inicio';
  v_r    record;
  v_ok   boolean;
  v_tmp  text;

  -- usuários (auth.users.id)
  v_p1 uuid := gen_random_uuid();  v_p2 uuid := gen_random_uuid();
  v_ua uuid := gen_random_uuid();  v_ub uuid := gen_random_uuid();
  v_uc uuid := gen_random_uuid();  v_ud uuid := gen_random_uuid();
  v_ux uuid := gen_random_uuid();
  -- alunos (students.id): A,B = Personal 1 | C = Personal 2 | D = Personal 1 (sem consentimentos)
  v_sa uuid := gen_random_uuid();  v_sb uuid := gen_random_uuid();
  v_sc uuid := gen_random_uuid();  v_sd uuid := gen_random_uuid();
  -- exercícios
  v_ex1 uuid := gen_random_uuid(); v_ex2 uuid := gen_random_uuid(); v_ex3 uuid := gen_random_uuid();
  v_exg uuid := gen_random_uuid(); v_exg2 uuid := gen_random_uuid();
  -- treinos
  v_plan_a uuid := gen_random_uuid(); v_plan_b uuid := gen_random_uuid(); v_plan_c uuid := gen_random_uuid();
  v_tpl uuid := gen_random_uuid();    v_draft_a uuid := gen_random_uuid();
  v_wa uuid := gen_random_uuid();  v_wb uuid := gen_random_uuid();  v_wd uuid := gen_random_uuid();
  v_wea1 uuid := gen_random_uuid(); v_wea2 uuid := gen_random_uuid();
  v_web uuid := gen_random_uuid();  v_wed uuid := gen_random_uuid();
  v_sess_a uuid := gen_random_uuid(); v_sess_b uuid := gen_random_uuid();
  -- avaliações, fotos, check-ins
  v_m_g uuid := gen_random_uuid();  v_m_p1 uuid := gen_random_uuid(); v_m_p2 uuid := gen_random_uuid();
  v_asm_a uuid := gen_random_uuid(); v_asm_b uuid := gen_random_uuid();
  v_set_a uuid := gen_random_uuid(); v_set_b uuid := gen_random_uuid();
  v_ck_a uuid := gen_random_uuid();  v_ck_b uuid := gen_random_uuid();
  -- chat
  v_conv_a uuid; v_conv_b uuid; v_conv_c uuid; v_conv_d uuid;
  v_msg_a uuid;
  v_week date := date_trunc('week', current_date)::date;
begin
  perform set_config('test.orig_role', current_user, true);

  begin  -- bloco interno: tudo aqui dentro é desfeito no final
    -- =================================================================
    -- FIXTURES (criadas como administrador)
    -- =================================================================
    v_step := 'fixtures: usuarios';
    insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
                            email_confirmed_at, created_at, updated_at)
    values
      (v_p1, 'authenticated', 'authenticated', 'p1@teste.invalid', '{}'::jsonb, '{}'::jsonb, now(), now(), now()),
      (v_p2, 'authenticated', 'authenticated', 'p2@teste.invalid', '{}'::jsonb, '{}'::jsonb, now(), now(), now()),
      -- usuário sem perfil, tentando "se declarar" personal pelo user_metadata (deve ser ignorado)
      (v_ux, 'authenticated', 'authenticated', 'x@teste.invalid', '{}'::jsonb, '{"role":"personal"}'::jsonb, now(), now(), now());

    insert into public.profiles (id, role, full_name, email) values
      (v_p1, 'personal', 'Personal Um',   'p1@teste.invalid'),
      (v_p2, 'personal', 'Personal Dois', 'p2@teste.invalid');

    v_step := 'fixtures: alunos e convites';
    insert into public.students (id, personal_id, full_name, email) values
      (v_sa, v_p1, 'Aluno A', 'a@teste.invalid'),
      (v_sb, v_p1, 'Aluno B', 'b@teste.invalid'),
      (v_sc, v_p2, 'Aluno C', 'c@teste.invalid'),
      (v_sd, v_p1, 'Aluno D', 'd@teste.invalid');

    insert into public.student_invites (student_id, token_hash) values
      (v_sa, 'h-' || v_sa::text), (v_sb, 'h-' || v_sb::text),
      (v_sc, 'h-' || v_sc::text), (v_sd, 'h-' || v_sd::text);

    -- o trigger on_auth_user_created cria o perfil e vincula o aluno ao convite
    insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
                            email_confirmed_at, created_at, updated_at)
    values
      (v_ua, 'authenticated', 'authenticated', 'a@teste.invalid', jsonb_build_object('role', 'aluno', 'student_id', v_sa), '{}'::jsonb, now(), now(), now()),
      (v_ub, 'authenticated', 'authenticated', 'b@teste.invalid', jsonb_build_object('role', 'aluno', 'student_id', v_sb), '{}'::jsonb, now(), now(), now()),
      (v_uc, 'authenticated', 'authenticated', 'c@teste.invalid', jsonb_build_object('role', 'aluno', 'student_id', v_sc), '{}'::jsonb, now(), now(), now()),
      (v_ud, 'authenticated', 'authenticated', 'd@teste.invalid', jsonb_build_object('role', 'aluno', 'student_id', v_sd), '{}'::jsonb, now(), now(), now());

    v_step := 'fixtures: consentimentos';
    -- A, B, C aceitam os 3 consentimentos obrigatórios (D não aceita nenhum)
    insert into public.consents (user_id, student_id, type, version)
    select x.u, x.s, t, '1.0'
      from (values (v_ua, v_sa), (v_ub, v_sb), (v_uc, v_sc)) as x(u, s)
      cross join unnest(array['termos_uso', 'politica_privacidade', 'dados_saude']::public.consent_type[]) as t;
    -- somente A autoriza fotos de evolução
    insert into public.consents (user_id, student_id, type, version)
    values (v_ua, v_sa, 'fotos_evolucao', '1.0');

    select id into v_conv_a from public.conversations where student_id = v_sa;
    select id into v_conv_b from public.conversations where student_id = v_sb;
    select id into v_conv_c from public.conversations where student_id = v_sc;
    select id into v_conv_d from public.conversations where student_id = v_sd;

    insert into public.student_private_notes (student_id, personal_id, note)
    values (v_sa, v_p1, 'nota privada do Personal 1 sobre A');

    v_step := 'fixtures: exercicios e treinos';
    insert into public.exercises (id, owner_id, name) values
      (v_ex1,  v_p1,  'ZZ Ex P1 usado'),
      (v_ex2,  v_p1,  'ZZ Ex P1 nao usado por A'),
      (v_ex3,  v_p2,  'ZZ Ex P2'),
      (v_exg,  null,  'ZZ Ex Global usado por A'),
      (v_exg2, null,  'ZZ Ex Global so em rascunho');

    insert into public.workout_plans (id, personal_id, student_id, name, status) values
      (v_plan_a, v_p1, v_sa, 'Plano A', 'ativo'),
      (v_plan_b, v_p1, v_sb, 'Plano B', 'ativo'),
      (v_plan_c, v_p2, v_sc, 'Plano C', 'ativo');
    insert into public.workout_plans (id, personal_id, student_id, name, status)
    values (v_draft_a, v_p1, v_sa, 'Rascunho A', 'rascunho');
    insert into public.workout_plans (id, personal_id, name, is_template, status)
    values (v_tpl, v_p1, 'Modelo P1', true, 'rascunho');

    insert into public.workouts (id, plan_id, name, position) values
      (v_wa, v_plan_a,  'Treino A',  1),
      (v_wb, v_plan_b,  'Treino B',  1),
      (v_wd, v_draft_a, 'Rascunho',  1);
    insert into public.workout_exercises (id, workout_id, exercise_id, position) values
      (v_wea1, v_wa, v_ex1,  1),
      (v_wea2, v_wa, v_exg,  2),
      (v_web,  v_wb, v_ex2,  1),
      (v_wed,  v_wd, v_exg2, 1);

    insert into public.workout_sessions (id, student_id, workout_id, plan_id, workout_name_snapshot) values
      (v_sess_a, v_sa, v_wa, v_plan_a, 'Treino A'),
      (v_sess_b, v_sb, v_wb, v_plan_b, 'Treino B');
    insert into public.set_logs (session_id, workout_exercise_id, exercise_id, exercise_name_snapshot, set_number, reps_done, load_kg) values
      (v_sess_a, v_wea1, v_ex1, 'ZZ Ex P1 usado',            1, 10, 20),
      (v_sess_b, v_web,  v_ex2, 'ZZ Ex P1 nao usado por A',  1, 10, 30);

    v_step := 'fixtures: avaliacoes, fotos e check-ins';
    insert into public.assessment_metrics (id, owner_id, key, label) values
      (v_m_g,  null, 'zz_metric_global', 'Metrica global de teste'),
      (v_m_p1, v_p1, 'zz_metric_p1',     'Metrica do Personal 1'),
      (v_m_p2, v_p2, 'zz_metric_p2',     'Metrica do Personal 2');
    insert into public.assessments (id, student_id, personal_id) values
      (v_asm_a, v_sa, v_p1), (v_asm_b, v_sb, v_p1);
    insert into public.assessment_values (assessment_id, metric_id, value_numeric) values
      (v_asm_a, v_m_g, 80), (v_asm_b, v_m_g, 90);

    insert into public.progress_photo_sets (id, student_id, created_by) values
      (v_set_a, v_sa, v_ua), (v_set_b, v_sb, v_ub);
    insert into public.progress_photos (set_id, student_id, angle, storage_path) values
      (v_set_a, v_sa, 'frente', v_sa::text || '/' || v_set_a::text || '/frente.webp'),
      (v_set_b, v_sb, 'frente', v_sb::text || '/' || v_set_b::text || '/frente.webp');

    insert into public.weekly_checkins (id, student_id, week_start, energy) values
      (v_ck_a, v_sa, v_week, 3), (v_ck_b, v_sb, v_week, 3);

    -- =================================================================
    -- A. FLUXO DE CONVITE E ATIVAÇÃO
    -- =================================================================
    v_step := 'A. convite e ativacao';
    select status::text into v_tmp from public.students where id = v_sa;
    v_res := v_res || pg_temp.r(v_tmp = 'ativo',
      'Aluno vira "ativo" automaticamente ao aceitar os consentimentos obrigatórios', 'status=' || coalesce(v_tmp, 'null'));

    select status::text into v_tmp from public.students where id = v_sd;
    v_res := v_res || pg_temp.r(v_tmp = 'convidado',
      'Aluno sem consentimentos continua "convidado"', 'status=' || coalesce(v_tmp, 'null'));

    select count(*) > 0 into v_ok from public.student_invites where student_id = v_sa and accepted_at is not null;
    v_res := v_res || pg_temp.r(v_ok, 'Convite é marcado como aceito ao criar a conta do aluno');

    select count(*) = 0 into v_ok from public.profiles where id = v_ux;
    v_res := v_res || pg_temp.r(v_ok,
      'Usuário que se declara "personal" no user_metadata NÃO ganha perfil (papel só vem do servidor)');

    v_ok := false;
    begin
      insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
      values (gen_random_uuid(), 'authenticated', 'authenticated', 'outro@teste.invalid',
              jsonb_build_object('role', 'aluno', 'student_id', v_sc), '{}'::jsonb, now(), now(), now());
    exception when others then
      v_ok := true; v_tmp := sqlerrm;
    end;
    v_res := v_res || pg_temp.r(v_ok, 'Convite com e-mail diferente do cadastrado é BLOQUEADO', v_tmp);

    v_ok := false;
    begin
      insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
      values (gen_random_uuid(), 'authenticated', 'authenticated', 'a2@teste.invalid',
              jsonb_build_object('role', 'aluno', 'student_id', v_sa), '{}'::jsonb, now(), now(), now());
    exception when others then
      v_ok := true; v_tmp := sqlerrm;
    end;
    v_res := v_res || pg_temp.r(v_ok, 'Aluno já vinculado não pode ser vinculado de novo (convite usado)', v_tmp);

    -- =================================================================
    -- B. ISOLAMENTO ENTRE ALUNOS (leitura)
    -- =================================================================
    v_step := 'B. isolamento entre alunos';
    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.students');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A enxerga só o próprio cadastro', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format('select count(*) from public.students where id = %L', v_sb));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Aluno A NÃO enxerga o Aluno B', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.workout_plans');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1,
      'Aluno A vê só o próprio plano ATIVO (não vê rascunho, modelo nem plano de outro)', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.workout_sessions');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A vê só as próprias sessões de treino', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.set_logs');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A vê só as próprias séries registradas', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.assessments');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A vê só as próprias avaliações', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.assessment_values');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A vê só os próprios valores de avaliação', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.v_student_metric_series');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'View de gráficos respeita a RLS (aluno A vê só a própria série)', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.progress_photos');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A vê só as próprias fotos', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.weekly_checkins');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A vê só os próprios check-ins', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.student_private_notes');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Aluno NÃO vê notas privadas do Personal', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.student_invites');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Aluno NÃO vê convites', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.exercises');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 2,
      'Aluno A vê só os exercícios do treino dele (2), não os de rascunho nem de outros', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, $q$select count(*) from public.assessment_metrics where key = 'zz_metric_p2'$q$);
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Aluno NÃO vê métrica personalizada de OUTRO Personal', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, $q$select count(*) from public.assessment_metrics where key in ('zz_metric_p1', 'zz_metric_global')$q$);
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 2, 'Aluno vê as métricas globais e as do SEU Personal', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.conversations');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A vê só a própria conversa', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.profiles');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 2, 'Aluno A vê só o próprio perfil e o do seu Personal', coalesce(v_r.err, 'visto=' || v_r.n));

    -- =================================================================
    -- C. ISOLAMENTO ENTRE PERSONAIS
    -- =================================================================
    v_step := 'C. isolamento entre personais';
    select * into v_r from pg_temp.exec_as(v_p1, 'select count(*) from public.students');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 3, 'Personal 1 enxerga só os 3 alunos dele (A, B, D)', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, format('select count(*) from public.students where id = %L', v_sc));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Personal 1 NÃO enxerga o aluno do Personal 2', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p2, 'select count(*) from public.students');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Personal 2 enxerga só o aluno dele', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, 'select count(*) from public.workout_plans');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 4, 'Personal 1 vê os 4 treinos/modelos dele e nenhum do Personal 2', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, 'select count(*) from public.workout_sessions');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 2, 'Personal 1 vê as sessões dos alunos dele', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p2, 'select count(*) from public.workout_sessions');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Personal 2 NÃO vê sessões de alunos do Personal 1', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p2, 'select count(*) from public.assessments');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Personal 2 NÃO vê avaliações de alunos do Personal 1', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p2, 'select count(*) from public.student_private_notes');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Personal 2 NÃO vê notas privadas do Personal 1', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, 'select count(*) from public.student_private_notes');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Personal 1 vê as próprias notas privadas', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1,
      format('select count(*) from public.exercises where id in (%L, %L, %L, %L, %L)', v_ex1, v_ex2, v_ex3, v_exg, v_exg2));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 4,
      'Personal 1 vê exercícios globais + próprios (4) e NÃO o exercício do Personal 2', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, 'select count(*) from public.conversations');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 3, 'Personal 1 vê só as conversas dos alunos dele', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, 'select count(*) from public.profiles');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 4, 'Personal 1 vê o próprio perfil e o dos 3 alunos dele (não o do aluno C)', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, 'select count(*) from public.v_student_metric_series');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 2, 'View de gráficos: Personal 1 vê a série dos alunos dele', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p2, 'select count(*) from public.v_student_metric_series');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'View de gráficos: Personal 2 não vê série de alunos alheios', coalesce(v_r.err, 'visto=' || v_r.n));

    -- =================================================================
    -- D. ESCRITAS PROIBIDAS
    -- =================================================================
    v_step := 'D. escritas proibidas';
    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (insert into public.workout_plans (personal_id, student_id, name) values (%L, %L, 'Invasao') returning 1)
      select count(*) from x $q$, v_p1, v_sc));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Personal 1 NÃO cria treino para aluno do Personal 2', v_r.err);

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (insert into public.assessments (student_id, personal_id) values (%L, %L) returning 1)
      select count(*) from x $q$, v_sc, v_p1));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Personal 1 NÃO cria avaliação para aluno do Personal 2', v_r.err);

    select * into v_r from pg_temp.exec_as(v_p2, format($q$
      with x as (update public.students set full_name = 'Invadido' where id = %L returning 1)
      select count(*) from x $q$, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is not null or v_r.n = 0, 'Personal 2 NÃO altera aluno do Personal 1', coalesce(v_r.err, 'linhas alteradas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.students set personal_id = %L where id = %L returning 1)
      select count(*) from x $q$, v_p2, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Personal 1 NÃO transfere aluno para outro Personal', v_r.err);

    select * into v_r from pg_temp.exec_as(v_p2, format($q$
      with x as (delete from public.exercises where id = %L returning 1)
      select count(*) from x $q$, v_ex1));
    v_res := v_res || pg_temp.r(v_r.err is not null or v_r.n = 0, 'Personal 2 NÃO apaga exercício do Personal 1', coalesce(v_r.err, 'linhas apagadas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.students set status = 'ativo' where id = %L returning 1)
      select count(*) from x $q$, v_sd));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Personal NÃO pula os consentimentos ativando o aluno manualmente', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.students set status = 'pausado' where id = %L returning 1)
      select count(*) from x $q$, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO altera o próprio status', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.students set personal_id = %L where id = %L returning 1)
      select count(*) from x $q$, v_p2, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO troca o próprio Personal', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.students set goal = 'Ganhar massa' where id = %L returning 1)
      select count(*) from x $q$, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno PODE editar o próprio objetivo (campo permitido)', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.profiles set role = 'personal' where id = %L returning 1)
      select count(*) from x $q$, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO consegue se promover a Personal (profiles.role)', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.profiles set full_name = 'Aluno A Renomeado' where id = %L returning 1)
      select count(*) from x $q$, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno PODE editar o próprio nome', coalesce(v_r.err, 'linhas=' || v_r.n));

    select full_name into v_tmp from public.students where id = v_sa;
    v_res := v_res || pg_temp.r(v_tmp = 'Aluno A Renomeado', 'Nome do perfil é sincronizado com o cadastro do aluno', v_tmp);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.students (personal_id, full_name, email) values (%L, 'Falso', 'falso@teste.invalid') returning 1)
      select count(*) from x $q$, v_p1));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO cadastra outros alunos', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.set_logs (session_id, exercise_name_snapshot, set_number) values (%L, 'x', 1) returning 1)
      select count(*) from x $q$, v_sess_b));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO registra série na sessão de OUTRO aluno', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.workout_sessions (student_id, workout_name_snapshot) values (%L, 'x') returning 1)
      select count(*) from x $q$, v_sb));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO cria sessão em nome de OUTRO aluno', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.workout_sessions (student_id, workout_id, workout_name_snapshot) values (%L, %L, 'x') returning 1)
      select count(*) from x $q$, v_sa, v_wb));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO inicia treino que pertence a OUTRO aluno', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.workout_sessions (student_id, workout_id, plan_id, workout_name_snapshot) values (%L, %L, %L, 'Treino A') returning 1)
      select count(*) from x $q$, v_sa, v_wa, v_plan_a));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno PODE iniciar o próprio treino', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.set_logs (session_id, workout_exercise_id, exercise_id, exercise_name_snapshot, set_number, reps_done, load_kg)
                 values (%L, %L, %L, 'ZZ Ex Global usado por A', 1, 8, 10) returning 1)
      select count(*) from x $q$, v_sess_a, v_wea2, v_exg));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno PODE registrar série na própria sessão', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.assessments (student_id, personal_id) values (%L, %L) returning 1)
      select count(*) from x $q$, v_sa, v_p1));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO cria avaliações', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.exercises (owner_id, name) values (%L, 'Exercicio do aluno') returning 1)
      select count(*) from x $q$, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO cadastra exercícios', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.notifications (user_id, type, title) values (%L, 'sistema', 'falsa') returning 1)
      select count(*) from x $q$, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Usuário NÃO cria notificações (só triggers/servidor)', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, $q$
      with x as (insert into public.audit_logs (action) values ('forjado') returning 1)
      select count(*) from x $q$);
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Usuário NÃO escreve direto em audit_logs', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.conversations (personal_id, student_id) values (%L, %L) returning 1)
      select count(*) from x $q$, v_p1, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Usuário NÃO cria conversas diretamente', v_r.err);

    -- =================================================================
    -- E. CONSENTIMENTOS (LGPD)
    -- =================================================================
    v_step := 'E. consentimentos';
    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.consents (user_id, student_id, type, version) values (%L, %L, 'termos_uso', '9.9') returning 1)
      select count(*) from x $q$, v_ua, v_sb));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO registra consentimento em nome de OUTRO aluno (student_id)', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.consents (user_id, student_id, type, version) values (%L, %L, 'termos_uso', '9.9') returning 1)
      select count(*) from x $q$, v_ub, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO registra consentimento em nome de OUTRO usuário (user_id)', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.consents (user_id, student_id, type, version) values (%L, %L, 'uso_imagem_marketing', '1.0') returning 1)
      select count(*) from x $q$, v_ua, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno PODE registrar o próprio consentimento', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.consents set revoked_at = now() where user_id = %L and type = 'uso_imagem_marketing' returning 1)
      select count(*) from x $q$, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno PODE revogar o próprio consentimento', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.consents set revoked_at = null where user_id = %L and type = 'uso_imagem_marketing' returning 1)
      select count(*) from x $q$, v_ua));
    select revoked_at is not null into v_ok from public.consents where user_id = v_ua and type = 'uso_imagem_marketing';
    v_res := v_res || pg_temp.r(v_ok, 'Consentimento revogado NÃO pode ser "reativado" (precisa novo aceite)', coalesce(v_r.err, 'ok'));

    -- =================================================================
    -- F. ALUNO "CONVIDADO" (ainda não aceitou os consentimentos)
    -- =================================================================
    v_step := 'F. aluno convidado';
    select * into v_r from pg_temp.exec_as(v_ud, 'select count(*) from public.students');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno convidado enxerga o próprio cadastro (para aceitar os termos)', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ud, format($q$
      with x as (insert into public.workout_sessions (student_id, workout_name_snapshot) values (%L, 'x') returning 1)
      select count(*) from x $q$, v_sd));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno convidado NÃO usa treinos antes de aceitar os consentimentos', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ud, format($q$
      with x as (insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'oi') returning 1)
      select count(*) from x $q$, v_conv_d, v_ud));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno convidado NÃO envia mensagens antes de ativar', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ud, format($q$
      with x as (insert into public.consents (user_id, student_id, type, version) values (%L, %L, 'termos_uso', '1.0') returning 1)
      select count(*) from x $q$, v_ud, v_sd));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno convidado PODE aceitar os termos', coalesce(v_r.err, 'linhas=' || v_r.n));

    -- =================================================================
    -- G. CHAT E NOTIFICAÇÕES
    -- =================================================================
    v_step := 'G. chat e notificacoes';
    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'Ola Personal') returning 1)
      select count(*) from x $q$, v_conv_a, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A PODE enviar mensagem na própria conversa', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'Invasao') returning 1)
      select count(*) from x $q$, v_conv_b, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno A NÃO envia mensagem na conversa de OUTRO aluno', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'Fingindo ser o Personal') returning 1)
      select count(*) from x $q$, v_conv_a, v_p1));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Ninguém envia mensagem se passando por OUTRO remetente', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.messages (conversation_id, sender_id, type, body) values (%L, %L, 'sistema', 'msg falsa do sistema') returning 1)
      select count(*) from x $q$, v_conv_a, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Usuário NÃO cria mensagens do tipo "sistema"', v_r.err);

    select * into v_r from pg_temp.exec_as(v_p1, format('select count(*) from public.messages where conversation_id = %L', v_conv_a));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Personal 1 lê a mensagem do aluno A', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ub, 'select count(*) from public.messages');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Aluno B NÃO lê a conversa do aluno A', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p2, 'select count(*) from public.messages');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Personal 2 NÃO lê conversas do Personal 1', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, $q$select count(*) from public.notifications where type = 'nova_mensagem' and read_at is null$q$);
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Personal 1 recebeu notificação de nova mensagem (trigger)', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format('select count(*) from public.notifications where user_id = %L', v_p1));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Aluno NÃO lê notificações do Personal', coalesce(v_r.err, 'visto=' || v_r.n));

    select id into v_msg_a from public.messages where conversation_id = v_conv_a limit 1;

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.messages set deleted_at = now() where id = %L returning 1)
      select count(*) from x $q$, v_msg_a));
    v_res := v_res || pg_temp.r(v_r.err is not null or v_r.n = 0, 'Personal NÃO apaga mensagem escrita pelo aluno', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.messages set body = 'editada' where id = %L returning 1)
      select count(*) from x $q$, v_msg_a));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Ninguém edita o texto de mensagens (só excluir)', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.messages set deleted_at = now() where id = %L returning 1)
      select count(*) from x $q$, v_msg_a));
    select (body is null and deleted_at is not null) into v_ok from public.messages where id = v_msg_a;
    v_res := v_res || pg_temp.r(v_r.err is null and v_ok, 'Autor PODE excluir a própria mensagem (conteúdo é apagado)', coalesce(v_r.err, 'ok'));

    -- =================================================================
    -- H. CHECK-IN SEMANAL
    -- =================================================================
    v_step := 'H. check-in';
    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.weekly_checkins set energy = 4 where id = %L returning 1)
      select count(*) from x $q$, v_ck_a));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno PODE editar o próprio check-in (antes da resposta)', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.weekly_checkins set energy = 1 where id = %L returning 1)
      select count(*) from x $q$, v_ck_b));
    v_res := v_res || pg_temp.r(v_r.err is not null or v_r.n = 0, 'Aluno A NÃO edita check-in do aluno B', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.weekly_checkins set personal_reply = 'eu mesmo respondi' where id = %L returning 1)
      select count(*) from x $q$, v_ck_a));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO escreve a resposta do Personal', v_r.err);

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.weekly_checkins set personal_reply = 'Bom trabalho!' where id = %L returning 1)
      select count(*) from x $q$, v_ck_a));
    select replied_at is not null into v_ok from public.weekly_checkins where id = v_ck_a;
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1 and v_ok, 'Personal PODE responder o check-in (data da resposta é automática)', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.weekly_checkins set energy = 1 where id = %L returning 1)
      select count(*) from x $q$, v_ck_a));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Personal NÃO altera as respostas do aluno no check-in', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.weekly_checkins set energy = 2 where id = %L returning 1)
      select count(*) from x $q$, v_ck_a));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO edita check-in depois de respondido', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format('select count(*) from public.notifications where type = %L', 'checkin_respondido'));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno recebeu notificação da resposta do check-in (trigger)', coalesce(v_r.err, 'visto=' || v_r.n));

    -- perguntas novas do feedback semanal (migração 20260923000001)
    select * into v_r from pg_temp.exec_as(v_ub, format($q$
      with x as (update public.weekly_checkins set training_feeling = 4, progress_feeling = 3, difficulties = 'teste' where id = %L returning 1)
      select count(*) from x $q$, v_ck_b));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno PODE responder as perguntas novas do feedback', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.weekly_checkins set training_feeling = 1 where id = %L returning 1)
      select count(*) from x $q$, v_ck_b));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Personal NÃO altera "como se sentiu nos treinos" do aluno', v_r.err);

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.weekly_checkins set difficulties = 'mudado' where id = %L returning 1)
      select count(*) from x $q$, v_ck_b));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Personal NÃO altera as dificuldades relatadas pelo aluno', v_r.err);

    -- dias de treino combinados (students.training_days)
    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.students set training_days = '{1,3,5}' where id = %L returning 1)
      select count(*) from x $q$, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Personal PODE definir os dias de treino do aluno', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (update public.students set training_days = '{1,2,3,4,5,6,7}' where id = %L returning 1)
      select count(*) from x $q$, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO altera os próprios dias de treino', v_r.err);

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.students set training_days = '{0,8}' where id = %L returning 1)
      select count(*) from x $q$, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Dia de treino inválido é recusado (só 1 a 7)', v_r.err);

    -- =================================================================
    -- I. FOTOS (exigem consentimento) e STORAGE
    -- =================================================================
    v_step := 'I. fotos';
    select * into v_r from pg_temp.exec_as(v_p1, 'select count(*) from public.progress_photos');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1,
      'Personal 1 vê só as fotos do aluno que autorizou (A); não vê as do B (sem consentimento)', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p2, 'select count(*) from public.progress_photos');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Personal 2 NÃO vê fotos de alunos do Personal 1', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ub, 'select count(*) from public.progress_photos');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno B vê só a própria foto (não a do A)', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.progress_photo_sets (student_id, created_by) values (%L, %L) returning 1)
      select count(*) from x $q$, v_sa, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno A (com consentimento) PODE criar conjunto de fotos', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ub, format($q$
      with x as (insert into public.progress_photo_sets (student_id, created_by) values (%L, %L) returning 1)
      select count(*) from x $q$, v_sb, v_ub));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno B (SEM consentimento de fotos) NÃO cria conjunto de fotos', v_r.err);

    select * into v_r from pg_temp.exec_as(v_ua, format($q$
      with x as (insert into public.progress_photo_sets (student_id, created_by) values (%L, %L) returning 1)
      select count(*) from x $q$, v_sb, v_ua));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno A NÃO cria fotos na conta do aluno B', v_r.err);

    -- ---- Storage (só roda se o 04_storage.sql foi executado) ----------
    v_step := 'I. storage';
    if exists (select 1 from storage.buckets where id = 'progress-photos')
       and exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'app_photos_insert')
       and exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'app_chat_insert') then

      select * into v_r from pg_temp.exec_as(v_ua, format($q$
        with x as (insert into storage.objects (bucket_id, name) values ('progress-photos', %L) returning 1)
        select count(*) from x $q$, v_sa::text || '/' || v_set_a::text || '/lado-1.webp'));
      v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Storage: aluno A PODE enviar foto para a própria pasta', coalesce(v_r.err, 'linhas=' || v_r.n));

      select * into v_r from pg_temp.exec_as(v_ua, format($q$
        with x as (insert into storage.objects (bucket_id, name) values ('progress-photos', %L) returning 1)
        select count(*) from x $q$, v_sb::text || '/' || v_set_b::text || '/invasao.webp'));
      v_res := v_res || pg_temp.r(v_r.err is not null, 'Storage: aluno A NÃO envia arquivo para a pasta do aluno B', v_r.err);

      select * into v_r from pg_temp.exec_as(v_ub, format($q$
        with x as (insert into storage.objects (bucket_id, name) values ('progress-photos', %L) returning 1)
        select count(*) from x $q$, v_sb::text || '/' || v_set_b::text || '/sem-consent.webp'));
      v_res := v_res || pg_temp.r(v_r.err is not null, 'Storage: aluno B NÃO envia foto sem consentimento', v_r.err);

      select * into v_r from pg_temp.exec_as(v_p1, $q$select count(*) from storage.objects where bucket_id = 'progress-photos'$q$);
      v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Storage: Personal 1 lê a foto do aluno A (consentimento ativo)', coalesce(v_r.err, 'visto=' || v_r.n));

      select * into v_r from pg_temp.exec_as(v_ub, $q$select count(*) from storage.objects where bucket_id = 'progress-photos'$q$);
      v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Storage: aluno B NÃO lê a foto do aluno A', coalesce(v_r.err, 'visto=' || v_r.n));

      select * into v_r from pg_temp.exec_as(v_p2, $q$select count(*) from storage.objects where bucket_id = 'progress-photos'$q$);
      v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Storage: Personal 2 NÃO lê fotos de alunos do Personal 1', coalesce(v_r.err, 'visto=' || v_r.n));

      select * into v_r from pg_temp.exec_as(v_ua, $q$select count(*) from storage.objects where bucket_id = 'progress-photos'$q$);
      v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Storage: aluno A lê a própria foto', coalesce(v_r.err, 'visto=' || v_r.n));

      select * into v_r from pg_temp.exec_as(v_ua, format($q$
        with x as (insert into storage.objects (bucket_id, name) values ('chat-attachments', %L) returning 1)
        select count(*) from x $q$, v_conv_a::text || '/anexo.webp'));
      v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Storage: aluno A PODE anexar arquivo na própria conversa', coalesce(v_r.err, 'linhas=' || v_r.n));

      select * into v_r from pg_temp.exec_as(v_ua, format($q$
        with x as (insert into storage.objects (bucket_id, name) values ('chat-attachments', %L) returning 1)
        select count(*) from x $q$, v_conv_b::text || '/anexo.webp'));
      v_res := v_res || pg_temp.r(v_r.err is not null, 'Storage: aluno A NÃO anexa arquivo em conversa alheia', v_r.err);

      select * into v_r from pg_temp.exec_as(v_ub, $q$select count(*) from storage.objects where bucket_id = 'chat-attachments'$q$);
      v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Storage: aluno B NÃO lê anexos da conversa do aluno A', coalesce(v_r.err, 'visto=' || v_r.n));
    else
      v_res := v_res || pg_temp.r(true, 'Storage: testes PULADOS (rode o 04_storage.sql para testá-los)');
    end if;

    -- revogação do consentimento de fotos: o Personal perde o acesso, o aluno mantém
    v_step := 'I. revogacao de fotos';
    update public.consents set revoked_at = now()
     where student_id = v_sa and type = 'fotos_evolucao';

    select * into v_r from pg_temp.exec_as(v_p1, 'select count(*) from public.progress_photos');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0,
      'Após o aluno REVOGAR o consentimento, o Personal deixa de ver as fotos', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.progress_photos');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'O aluno continua vendo as próprias fotos', coalesce(v_r.err, 'visto=' || v_r.n));

    -- =================================================================
    -- J. TREINOS: regras de negócio
    -- =================================================================
    v_step := 'J. treinos';
    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (update public.workout_plans set status = 'ativo' where id = %L returning 1)
      select count(*) from x $q$, v_draft_a));
    select status::text into v_tmp from public.workout_plans where id = v_plan_a;
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1 and v_tmp = 'encerrado',
      'Ativar um novo plano encerra automaticamente o plano anterior do aluno', coalesce(v_r.err, 'plano anterior=' || coalesce(v_tmp, 'null')));

    select * into v_r from pg_temp.exec_as(v_ua, $q$select count(*) from public.notifications where type = 'treino_atribuido'$q$);
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 2, 'Aluno recebeu notificações de treino (plano inicial + plano novo) via trigger', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p1, format($q$
      with x as (delete from public.workout_plans where id = %L returning 1)
      select count(*) from x $q$, v_plan_b));
    v_res := v_res || pg_temp.r(v_r.err is not null or v_r.n = 0, 'Plano ATIVO não pode ser apagado (só arquivado)', coalesce(v_r.err, 'linhas apagadas=' || v_r.n));

    -- =================================================================
    -- K. AUDITORIA
    -- =================================================================
    v_step := 'K. auditoria';
    select * into v_r from pg_temp.exec_as(v_ua, format($q$select count(*) from (select public.log_audit('teste', 'students', null, %L)) t$q$, v_sa));
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Aluno PODE registrar auditoria sobre si mesmo (RPC log_audit)', coalesce(v_r.err, 'linhas=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, format($q$select count(*) from (select public.log_audit('teste', 'students', null, %L)) t$q$, v_sb));
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Aluno NÃO registra auditoria sobre OUTRO aluno', v_r.err);

    select * into v_r from pg_temp.exec_as(v_p1, $q$select count(*) from public.audit_logs where action = 'teste'$q$);
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 1, 'Personal 1 lê os logs de auditoria do tenant dele', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ua, 'select count(*) from public.audit_logs');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Aluno NÃO lê logs de auditoria', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_p2, 'select count(*) from public.audit_logs');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Personal 2 NÃO lê logs do Personal 1', coalesce(v_r.err, 'visto=' || v_r.n));

    v_ok := false;
    begin
      delete from public.audit_logs where action = 'teste';
    exception when others then
      v_ok := true; v_tmp := sqlerrm;
    end;
    v_res := v_res || pg_temp.r(v_ok, 'audit_logs é somente-inserção (nem o administrador apaga linhas)', v_tmp);

    -- =================================================================
    -- L. USUÁRIO SEM PERFIL E ANÔNIMO
    -- =================================================================
    v_step := 'L. sem perfil e anonimo';
    select * into v_r from pg_temp.exec_as(v_ux, 'select count(*) from public.students');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Usuário autenticado SEM perfil não vê alunos', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ux, 'select count(*) from public.exercises');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Usuário SEM perfil não vê exercícios', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ux, 'select count(*) from public.assessment_metrics');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Usuário SEM perfil não vê o catálogo de métricas', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(v_ux, 'select count(*) from public.profiles');
    v_res := v_res || pg_temp.r(v_r.err is null and v_r.n = 0, 'Usuário SEM perfil não vê nenhum perfil', coalesce(v_r.err, 'visto=' || v_r.n));

    select * into v_r from pg_temp.exec_as(null, 'select count(*) from public.students');
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Visitante ANÔNIMO não acessa students', v_r.err);

    select * into v_r from pg_temp.exec_as(null, 'select count(*) from public.exercises');
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Visitante ANÔNIMO não acessa exercises', v_r.err);

    select * into v_r from pg_temp.exec_as(null, 'select count(*) from public.messages');
    v_res := v_res || pg_temp.r(v_r.err is not null, 'Visitante ANÔNIMO não acessa messages', v_r.err);

    -- fim: desfaz TUDO (fixtures incluídas)
    raise exception '__rollback__';
  exception when others then
    if sqlerrm <> '__rollback__' then
      v_res := v_res || pg_temp.r(false, 'ERRO INESPERADO no passo: ' || v_step, sqlstate || ' - ' || sqlerrm);
    end if;
  end;

  insert into pg_temp.teste_resultado (n, status, teste, detalhe)
  select ord::int,
         case when (e ->> 'ok')::boolean then 'OK' else 'FALHOU' end,
         e ->> 'desc',
         e ->> 'detail'
    from jsonb_array_elements(v_res) with ordinality as t(e, ord);
end;
$test$;

-- ---- resultado -------------------------------------------------------
select n, status, teste, detalhe
from (
  select 0 as n,
         case when count(*) filter (where status = 'FALHOU') = 0 then 'OK' else 'FALHOU' end as status,
         'RESUMO' as teste,
         count(*)::text || ' testes, ' || count(*) filter (where status = 'FALHOU')::text || ' falha(s)' as detalhe
    from pg_temp.teste_resultado
  union all
  select n, status, teste, detalhe from pg_temp.teste_resultado
) q
order by n;
