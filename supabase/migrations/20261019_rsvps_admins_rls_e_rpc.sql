-- Cópia da migração aplicada no projeto (rsvps_admins_rls_e_rpc). Veja supabase/README.md.
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 5 and 80),
  telefone text not null unique check (telefone ~ '^[0-9]{10,11}$'),
  confirmado boolean not null,
  presente text check (presente is null or char_length(presente) between 3 and 80),
  presente_detalhe text check (presente_detalhe is null or char_length(presente_detalhe) <= 120),
  presente_outro boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint rsvps_presente_coerente check (
    (confirmado and presente is not null)
    or (not confirmado and presente is null and presente_detalhe is null and not presente_outro)
  )
);
create index rsvps_atualizado_em_idx on public.rsvps (atualizado_em desc);
create table public.admins (
  email text primary key check (email = lower(email)),
  criado_em timestamptz not null default now()
);
alter table public.rsvps enable row level security;
alter table public.rsvps force row level security;
alter table public.admins enable row level security;
alter table public.admins force row level security;
revoke all on public.rsvps from public, anon, authenticated;
revoke all on public.admins from public, anon, authenticated;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins a where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))) $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant select on public.rsvps to authenticated;
create policy "admins leem respostas" on public.rsvps for select to authenticated using (public.is_admin());
-- registrar_resposta(...): função security definer com validações e prazo (definição completa no projeto).
