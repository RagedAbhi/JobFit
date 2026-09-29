-- Run once in the Supabase SQL Editor. Adds a column to store a
-- resume tailored to that specific job (see app/api/jobs/[jobId]/tailored-resume/route.ts).
alter table public.job_analyses add column if not exists tailored_resume jsonb;

-- job_analyses previously had select/insert/delete policies but no update
-- policy -- needed now to persist the generated tailored resume in place.
drop policy if exists "Users can update their own job analyses" on public.job_analyses;
create policy "Users can update their own job analyses"
  on public.job_analyses for update
  using (auth.uid() = user_id);
