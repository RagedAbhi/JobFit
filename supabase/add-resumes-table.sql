-- Run this once in the Supabase SQL Editor. Safe to re-run: uses IF NOT
-- EXISTS / OR REPLACE / guarded inserts throughout.
--
-- Adds multi-resume support: a `resumes` table (one row per named resume),
-- an active-resume pointer on `profiles`, and a resume reference on
-- `job_analyses`. Backfills every existing account's single resume into a
-- "My Resume" row and activates it. See
-- docs/specs/0001-multiple-resumes-add-switch/index.md.

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  resume_text text not null,
  resume_filename text not null,
  resume_page_count int not null,
  resume_char_count int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness per account, so the switcher/picker never
-- shows two indistinguishable resumes.
create unique index if not exists resumes_user_id_name_lower_idx
  on public.resumes (user_id, lower(name));

-- Used to pick "the most recently updated remaining resume" when the active
-- one is deleted.
create index if not exists resumes_user_id_updated_at_idx
  on public.resumes (user_id, updated_at desc);

alter table public.resumes enable row level security;

drop policy if exists "Users can view their own resumes" on public.resumes;
create policy "Users can view their own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own resumes" on public.resumes;
create policy "Users can insert their own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own resumes" on public.resumes;
create policy "Users can update their own resumes"
  on public.resumes for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own resumes" on public.resumes;
create policy "Users can delete their own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- Which resume is active. Null only for an account with zero resumes.
alter table public.profiles
  add column if not exists active_resume_id uuid references public.resumes (id) on delete set null;

-- Which resume produced this analysis. Null for rows created before this
-- migration, or whose resume was later deleted.
alter table public.job_analyses
  add column if not exists resume_id uuid references public.resumes (id) on delete set null;

-- Backfill: every account that already has a resume on its profile gets it
-- as a named resume called "My Resume". Guarded by NOT EXISTS so this file
-- stays safe to re-run without creating duplicates. The coalesces are a
-- defensive fallback only -- the original save path always wrote all four
-- resume_* columns together, so a mismatch should not occur in practice.
insert into public.resumes (user_id, name, resume_text, resume_filename, resume_page_count, resume_char_count, created_at, updated_at)
select
  p.id,
  'My Resume',
  p.resume_text,
  coalesce(p.resume_filename, 'resume.pdf'),
  coalesce(p.resume_page_count, 1),
  coalesce(p.resume_char_count, length(p.resume_text)),
  p.updated_at,
  p.updated_at
from public.profiles p
where p.resume_text is not null
  and not exists (
    select 1 from public.resumes r where r.user_id = p.id and lower(r.name) = lower('My Resume')
  );

update public.profiles p
set active_resume_id = r.id
from public.resumes r
where r.user_id = p.id
  and lower(r.name) = lower('My Resume')
  and p.active_resume_id is null;
