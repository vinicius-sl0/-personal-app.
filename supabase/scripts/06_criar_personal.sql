-- =====================================================================
-- 06_criar_personal.sql  |  Plataforma Personal Trainer
-- Transforma um usuário do Supabase Auth em PERSONAL.
--
-- PASSO A PASSO
--  1) Dashboard > Authentication > Users > "Add user" > "Create new user"
--     - E-mail do Personal e uma senha forte
--     - Marque "Auto Confirm User"
--  2) Edite as 3 linhas marcadas com <<< ALTERE (e-mail, nome, CREF)
--  3) Rode este script
--
-- Por segurança, ninguém vira Personal por cadastro público: só por este script.
-- =====================================================================
do $$
declare
  v_email text := 'personal@seudominio.com.br';   -- <<< ALTERE (o mesmo e-mail criado no passo 1)
  v_nome  text := 'Nome do Personal';             -- <<< ALTERE
  v_cref  text := '000000-G/CE';                  -- <<< ALTERE (ou deixe null)
  v_id    uuid;
begin
  select u.id into v_id from auth.users u where lower(u.email) = lower(v_email);

  if v_id is null then
    raise exception 'Usuario % nao encontrado em Authentication > Users. Crie-o primeiro (passo 1).', v_email;
  end if;

  insert into public.profiles (id, role, full_name, email)
  values (v_id, 'personal', v_nome, lower(v_email))
  on conflict (id) do nothing;

  insert into public.personal_profiles (profile_id, cref)
  values (v_id, v_cref)
  on conflict (profile_id) do nothing;
end;
$$;

-- Conferência: deve listar 1 linha com role = personal
select p.id, p.role, p.full_name, p.email, pp.cref
from public.profiles p
left join public.personal_profiles pp on pp.profile_id = p.id
where p.role = 'personal';
