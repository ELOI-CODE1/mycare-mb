-- Add a contact phone column for orders so clients can provide a call number.
-- Run this in the Supabase SQL editor if your database does not already have it.

alter table public.orders
  add column if not exists contact_phone text;
