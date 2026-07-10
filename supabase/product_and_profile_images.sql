-- ============================================================================
-- MyCare+ — Product & profile images
-- Run this in the Supabase SQL editor (Dashboard > SQL).
--
-- Adds:
--   1. products.image_url   -> product photos
--   2. profiles.avatar_url  -> admin/user profile photos
--   3. Two public Storage buckets: product-images, avatars
--   4. Storage RLS policies:
--        - anyone can READ (so images render in the app)
--        - only admins can write product images
--        - users can write their own avatar (file path must start with their uid)
-- ============================================================================

-- 1. New columns --------------------------------------------------------------
alter table public.products
  add column if not exists image_url text;

alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Storage buckets (public read) --------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Storage policies ---------------------------------------------------------
-- NOTE: public.is_admin() is defined in admin_user_management.sql — run that first.

-- Product images: public read, admin-only write.
drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product images admin insert" on storage.objects;
create policy "product images admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images admin update" on storage.objects;
create policy "product images admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- Avatars: public read, each user writes only their own folder (<uid>/...).
-- The app uploads avatars under the path "<auth.uid()>-<timestamp>.<ext>", so we
-- match on the file name starting with the user's id.
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name like auth.uid()::text || '%');

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name like auth.uid()::text || '%');

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name like auth.uid()::text || '%');
