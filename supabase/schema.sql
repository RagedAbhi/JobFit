-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- for your project. Safe to re-run: uses IF NOT EXISTS / OR REPLACE throughout.

-- One row per user, holding their resume text (extracted client-side from a
-- PDF, never the original file -- see README). 1:1 with auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  headline text,
  email text,
  phone text,
  location text,
  links jsonb not null default '[]',
  skills jsonb not null default '[]',
  years_experience int,
  summary text,
  work_experience jsonb not null default '[]',
  education jsonb not null default '[]',
  certifications jsonb not null default '[]',
  projects jsonb not null default '[]',
  resume_text text,
  resume_filename text,
  resume_page_count int,
  resume_char_count int,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create an empty profile row whenever a new user signs up, so the app
-- never has to handle a missing-profile case.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One row per resume-vs-job-description analysis run.
create table if not exists public.job_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_title text not null,
  job_description_text text not null,
  match_score int not null,
  summary text not null,
  matching_skills jsonb not null default '[]',
  missing_skills jsonb not null default '[]',
  optional_missing_skills jsonb not null default '[]',
  improvement_suggestions jsonb not null default '[]',
  tailored_resume jsonb,
  created_at timestamptz not null default now()
);

create index if not exists job_analyses_user_id_created_at_idx
  on public.job_analyses (user_id, created_at desc);

alter table public.job_analyses enable row level security;

drop policy if exists "Users can view their own job analyses" on public.job_analyses;
create policy "Users can view their own job analyses"
  on public.job_analyses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own job analyses" on public.job_analyses;
create policy "Users can insert their own job analyses"
  on public.job_analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own job analyses" on public.job_analyses;
create policy "Users can update their own job analyses"
  on public.job_analyses for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own job analyses" on public.job_analyses;
create policy "Users can delete their own job analyses"
  on public.job_analyses for delete
  using (auth.uid() = user_id);
