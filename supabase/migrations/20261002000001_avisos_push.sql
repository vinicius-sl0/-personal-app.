-- =====================================================================
-- 20261002000001_avisos_push.sql  |  Plataforma Personal Trainer
--
-- AVISOS NO CELULAR (push), com o app fechado.
--
-- Como funciona:
--   1. No app, a pessoa toca em "Ativar avisos"; o navegador cria uma inscrição
--      (endereço do aparelho + chaves) e o app grava com public.claim_push_subscription().
--   2. Quando nasce um aviso em public.notifications (sempre por trigger do banco), o
--      trigger abaixo chama a rota /api/push do site (via pg_net, sem travar o banco),
--      enviando SÓ o id do aviso e uma senha. O site lê o aviso e manda para os aparelhos.
--
-- O endereço da rota e a senha NÃO ficam neste arquivo (ele vai para o Git): ficam no
-- Vault do Supabase, gravados pelo script local supabase/.local/10_configurar_push.sql.
-- Sem eles, nada é enviado e o resto do app funciona normalmente.
--
-- Depois de rodar: rode de novo o scripts/08_testes_permissoes.sql.
-- =====================================================================

-- Chamadas HTTP a partir do banco (extensão oficial do Supabase).
create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------
-- Inscrição do aparelho
-- ---------------------------------------------------------------------
-- O endereço (endpoint) é gerado pelo navegador e só quem está com o aparelho o conhece.
-- Se o mesmo aparelho estava inscrito em OUTRA conta (celular compartilhado, alguém saiu
-- sem desativar), a inscrição passa para quem está logado agora — assim os avisos de uma
-- pessoa nunca continuam chegando no aparelho de outra.
create or replace function public.claim_push_subscription(
  p_endpoint   text,
  p_p256dh     text,
  p_auth       text,
  p_user_agent text default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'PUSH_SEM_PERFIL' using errcode = '42501';
  end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or char_length(p_endpoint) > 1000
     or char_length(coalesce(p_p256dh, '')) not between 20 and 200
     or char_length(coalesce(p_auth, '')) not between 10 and 100 then
    raise exception 'PUSH_INVALIDO' using errcode = '22023';
  end if;

  delete from public.push_subscriptions s where s.endpoint = p_endpoint and s.user_id <> v_uid;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth_key, user_agent)
  values (v_uid, p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300))
  on conflict (endpoint) do update
    set p256dh = excluded.p256dh,
        auth_key = excluded.auth_key,
        user_agent = excluded.user_agent;
end;
$$;

revoke execute on function public.claim_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.claim_push_subscription(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Envio: a cada aviso novo, chama o site
-- ---------------------------------------------------------------------
create or replace function private.notifications_push()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_url    text;
  v_secret text;
begin
  -- sem aparelho inscrito = nada a fazer
  if not exists (select 1 from public.push_subscriptions s where s.user_id = new.user_id) then
    return null;
  end if;
  -- respeita "aviso no celular desligado" para este tipo
  if exists (
    select 1 from public.notification_preferences np
     where np.user_id = new.user_id and np.type = new.type and np.channel = 'push' and not np.enabled
  ) then
    return null;
  end if;

  select ds.decrypted_secret into v_url from vault.decrypted_secrets ds where ds.name = 'push_webhook_url';
  select ds.decrypted_secret into v_secret from vault.decrypted_secrets ds where ds.name = 'push_webhook_secret';
  if v_url is null or v_secret is null then
    return null; -- ainda não configurado
  end if;

  -- Assíncrono: a chamada entra numa fila e sai depois que esta transação terminar.
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
    timeout_milliseconds := 5000
  );
  return null;
exception when others then
  -- Nunca impede o aviso dentro do app (nem a mensagem/treino que o gerou).
  raise warning 'notifications_push: %', sqlerrm;
  return null;
end;
$$;

revoke execute on function private.notifications_push() from public, anon, authenticated;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push
  after insert on public.notifications
  for each row execute function private.notifications_push();
