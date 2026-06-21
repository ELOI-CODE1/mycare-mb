-- ============================================================================
-- MyCare+ — User ⇄ Admin messaging
-- Run in the Supabase SQL editor (Dashboard > SQL).
-- ============================================================================

-- is_admin() helper (idempotent; also created by admin_user_management.sql)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Messages: one row per message. A "thread" is all rows for a given user_id.
-- sender = 'user'  -> from the customer to admin
-- sender = 'admin' -> reply from admin to that customer
-- is_read = read by the recipient.
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  sender     text not null check (sender in ('user', 'admin')),
  body       text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_user_created_idx on public.messages (user_id, created_at);

alter table public.messages enable row level security;

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    (auth.uid() = user_id and sender = 'user') or (public.is_admin() and sender = 'admin')
  );

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
  for update using (auth.uid() = user_id or public.is_admin());
