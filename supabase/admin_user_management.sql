-- ============================================================================
-- MyCare+ — Admin user management schema
-- Run this in the Supabase SQL editor (Dashboard > SQL).
--
-- Adds:
--   1. profiles.status        ('active' | 'suspended' | 'deleted')  -> suspend / soft-delete
--   2. admin_audit_log table  -> who did what to whom
--   3. is_admin() helper
--   4. RLS policies so the above powers are enforced server-side, not just in the UI
--
-- NOTE: Section 4 enables Row Level Security on `profiles`. If your project was
-- running with RLS OFF, test login / signup / admin screens after applying.
-- ============================================================================

-- 1. Account status -----------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'active';

-- Optional: constrain to known values.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_status_check') then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('active', 'suspended', 'deleted'));
  end if;
end $$;

-- 2. Audit log ----------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_user_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- 3. is_admin() helper --------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 4. RLS ----------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admin_audit_log enable row level security;

-- profiles: a user sees & edits their own row; an admin sees & edits everyone.
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_self_or_admin on public.profiles;
create policy profiles_insert_self_or_admin on public.profiles
  for insert with check (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
  for delete using (public.is_admin());

-- audit log: admins only.
drop policy if exists audit_admin_all on public.admin_audit_log;
create policy audit_admin_all on public.admin_audit_log
  for all using (public.is_admin()) with check (public.is_admin());
