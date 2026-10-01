-- =====================================================================
-- 20260930000001_interessados.sql  |  Plataforma Personal Trainer
--
-- "QUERO ME TORNAR ALUNO": visitantes da página inicial respondem algumas
-- perguntas (objetivo, experiência, dias por semana, online/presencial, nome e
-- WhatsApp) e são levados ao WhatsApp do Personal. As respostas ficam em
-- public.leads ("interessados" na interface) para o Personal acompanhar.
--
-- Segurança em camadas (mesmo padrão do resto do banco):
--   GRANT  -> visitante (anon) só pode INSERIR, e só as colunas das respostas;
--             o Personal lê, muda a situação/observação e exclui.
--   RLS    -> visitante não lê nada (nem o que acabou de enviar);
--             só o Personal dono vê as linhas.
--   TRIGGER-> o banco escolhe o Personal, força status "novo", barra envio
--             repetido do mesmo número e excesso de envios (spam), e impede
--             alterar as respostas depois.
--
-- Depois de rodar: rode de novo o scripts/08_testes_permissoes.sql e
-- regenere os tipos (database.types.ts).
-- =====================================================================

-- Novo tipo de aviso no sino do Personal.
-- (ADD VALUE não pode ser usado na mesma transação em que é criado; aqui ele
--  só é usado dentro de função, quando um interessado se cadastrar.)
alter type public.notification_type add value if not exists 'novo_interessado';

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  personal_id     uuid not null references public.personal_profiles (profile_id) on delete cascade,
  full_name       text not null check (char_length(btrim(full_name)) between 2 and 120),
  -- só dígitos, com 55 + DDD + número (10 ou 11 dígitos depois do 55)
  whatsapp        text not null check (whatsapp ~ '^55[1-9][0-9][0-9]{8,9}$'),
  goal            text not null check (goal in ('emagrecimento', 'hipertrofia', 'condicionamento', 'saude', 'outro')),
  experience      text not null check (experience in ('nunca', 'parei', 'treino')),
  days_per_week   smallint not null check (days_per_week between 1 and 7),
  modality        text not null check (modality in ('online', 'presencial', 'tanto_faz')),
  -- versão da Política de Privacidade que a pessoa aceitou ao enviar
  privacy_version text not null check (char_length(privacy_version) between 1 and 40),
  status          text not null default 'novo'
                  check (status in ('novo', 'em_conversa', 'virou_aluno', 'nao_fechou')),
  notes           text check (char_length(notes) <= 2000),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.leads is
  'Interessados em virar aluno (formulário "Quero me tornar aluno" da página inicial).';

create index if not exists leads_personal_created_idx on public.leads (personal_id, created_at desc);
create index if not exists leads_whatsapp_created_idx on public.leads (whatsapp, created_at desc);

-- ---------------------------------------------------------------------
-- GRANT mínimo
-- ---------------------------------------------------------------------
revoke all on public.leads from anon, authenticated;
grant insert (full_name, whatsapp, goal, experience, days_per_week, modality, privacy_version)
  on public.leads to anon, authenticated;
grant select, delete on public.leads to authenticated;
grant update (status, notes) on public.leads to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.leads enable row level security;

drop policy if exists leads_insert_public on public.leads;
create policy leads_insert_public on public.leads
  for insert to anon, authenticated
  with check (status = 'novo' and notes is null);

drop policy if exists leads_select_personal on public.leads;
create policy leads_select_personal on public.leads
  for select to authenticated
  using (personal_id = (select auth.uid()) and (select private.is_personal()));

drop policy if exists leads_update_personal on public.leads;
create policy leads_update_personal on public.leads
  for update to authenticated
  using (personal_id = (select auth.uid()) and (select private.is_personal()))
  with check (personal_id = (select auth.uid()));

drop policy if exists leads_delete_personal on public.leads;
create policy leads_delete_personal on public.leads
  for delete to authenticated
  using (personal_id = (select auth.uid()) and (select private.is_personal()));

-- ---------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------

-- Antes de inserir: o banco decide o Personal (o sistema tem um só) e barra spam.
create or replace function private.leads_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_personal uuid;
begin
  select pp.profile_id into v_personal
    from public.personal_profiles pp
   order by pp.created_at
   limit 1;
  if v_personal is null then
    raise exception 'LEAD_SEM_PERSONAL' using errcode = 'P0001';
  end if;

  new.personal_id := v_personal;
  new.status      := 'novo';
  new.notes       := null;
  new.created_at  := now();
  new.updated_at  := now();
  new.full_name   := btrim(new.full_name);

  -- mesmo número há menos de 10 minutos = envio repetido
  if exists (
    select 1 from public.leads l
     where l.whatsapp = new.whatsapp and l.created_at > now() - interval '10 minutes'
  ) then
    raise exception 'LEAD_REPETIDO' using errcode = 'P0001';
  end if;

  -- mais de 30 interessados na última hora = provável robô
  if (select count(*) from public.leads l where l.created_at > now() - interval '1 hour') >= 30 then
    raise exception 'LEAD_LIMITE' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists leads_before_insert on public.leads;
create trigger leads_before_insert
  before insert on public.leads
  for each row execute function private.leads_before_insert();

-- Depois de inserir: aviso no sino do Personal.
create or replace function private.leads_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.notify(
    new.personal_id,
    'novo_interessado',
    'Novo interessado',
    new.full_name || ' quer se tornar aluno',
    jsonb_build_object('lead_id', new.id),
    '/personal/interessados'
  );
  return new;
end;
$$;

drop trigger if exists leads_after_insert on public.leads;
create trigger leads_after_insert
  after insert on public.leads
  for each row execute function private.leads_after_insert();

-- Depois de enviadas, as respostas não mudam (só situação e observação do Personal).
create or replace function private.leads_guard()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.id              := old.id;
  new.personal_id     := old.personal_id;
  new.full_name       := old.full_name;
  new.whatsapp        := old.whatsapp;
  new.goal            := old.goal;
  new.experience      := old.experience;
  new.days_per_week   := old.days_per_week;
  new.modality        := old.modality;
  new.privacy_version := old.privacy_version;
  new.created_at      := old.created_at;
  new.updated_at      := now();
  return new;
end;
$$;

drop trigger if exists leads_guard on public.leads;
create trigger leads_guard
  before update on public.leads
  for each row execute function private.leads_guard();

revoke execute on function private.leads_before_insert() from public, anon, authenticated;
revoke execute on function private.leads_after_insert() from public, anon, authenticated;
revoke execute on function private.leads_guard() from public, anon, authenticated;
