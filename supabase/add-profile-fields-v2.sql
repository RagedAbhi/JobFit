-- Run once in the Supabase SQL Editor. Extends the profile fields added in
-- add-profile-fields.sql with full contact info, work history, education,
-- certifications, and projects (see app/api/profile/route.ts).
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists links jsonb not null default '[]';
alter table public.profiles add column if not exists work_experience jsonb not null default '[]';
alter table public.profiles add column if not exists education jsonb not null default '[]';
alter table public.profiles add column if not exists certifications jsonb not null default '[]';
alter table public.profiles add column if not exists projects jsonb not null default '[]';
