-- Run once in the Supabase SQL Editor. Adds the structured profile fields
-- (auto-extracted from the resume, and user-editable afterward -- see
-- app/api/profile/route.ts) alongside the existing full_name column.
alter table public.profiles add column if not exists headline text;
alter table public.profiles add column if not exists skills jsonb not null default '[]';
alter table public.profiles add column if not exists years_experience int;
alter table public.profiles add column if not exists summary text;
