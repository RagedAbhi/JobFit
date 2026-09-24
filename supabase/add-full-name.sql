-- Run once in the Supabase SQL Editor. Adds a column to store the
-- candidate's name, extracted from their resume when it's saved
-- (see app/api/profile/resume/route.ts).
alter table public.profiles add column if not exists full_name text;
