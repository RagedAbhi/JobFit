# Verify: multiple resumes: add and switch between named resumes · spec 0001 · updated 2026-10-01

_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

**Prerequisite, blocks every step below**: run `supabase/add-resumes-table.sql` in the Supabase SQL Editor (this project has no CLI or service role key, so it can't be applied automatically — see the Build plan note in `index.md`). None of these steps can pass until that migration has run against the target database.

## UI / manual

- [ ] After running the migration, check the `resumes` table exists with `profiles.active_resume_id` and `job_analyses.resume_id` columns present → AC-2
- [ ] Sign in with an account that had a resume before this feature shipped, open `/profile` → sees one resume named "My Resume" marked Active, nothing else about the account changed → AC-2
- [ ] On `/profile`, click "Add another resume", name it "Backend", upload a second PDF → saves without touching "My Resume"; the list now shows two resumes, "My Resume" still Active → AC-1
- [ ] Add resumes until the account has 5, then try a 6th → rejected with a clear cap message, no resume added → AC-1
- [ ] Try naming a new resume the same as an existing one, case-insensitive (e.g. "backend" vs "Backend") → rejected with a duplicate-name message → AC-5
- [ ] On `/profile`, click "Set active" on "Backend" → it becomes Active; the resume switcher in `AppNav` (top right, visible only once the account has more than one resume) now shows "Backend" → AC-4
- [ ] Open `/analyze` with 2+ resumes on file → a resume picker appears, pre-selected to the currently active resume → AC-3
- [ ] In that picker, pick a resume different from the currently active one and run an analysis → the analysis is produced, and afterward `/profile` and `AppNav` show the picked resume as the new active one → AC-3
- [ ] Inspect the resulting `job_analyses` row (DB or Supabase table editor) → its `resume_id` points at the resume picked for that run → AC-8
- [ ] Rename "Backend" to "Backend Dev" from `/profile` → the list updates, no duplicate-name conflict → AC-5
- [ ] Replace "Backend Dev"'s file while it is NOT the active resume → its filename/page/char count update, but the shared profile fields on `/profile` (skills, summary, etc.) do NOT change → AC-6
- [ ] Set "Backend Dev" active, then replace its file again → this time the shared profile fields DO update (re-extraction ran) → AC-6
- [ ] On an account with only one resume, try deleting it → rejected: "You can't delete your only remaining resume." → AC-7
- [ ] Try deleting a resume that has at least one analysis attached to it → rejected: "This resume has past analyses on file…" → AC-7
- [ ] With 2+ resumes and no analyses referencing the active one, delete the active resume → succeeds, and a different resume (the most recently updated remaining one) automatically becomes active → AC-7
- [ ] Signed in as account A, call `PATCH`/`DELETE`/`activate` on a `resumeId` that belongs to account B (or a random uuid) → 404 "Resume not found", nothing changes → security model behind AC-4, AC-5, AC-7

## Commands

- [ ] `npx tsc --noEmit` → passes
- [ ] `npm run lint` → passes
- [ ] `npm run build` → succeeds, `/api/resumes`, `/api/resumes/[resumeId]`, `/api/resumes/[resumeId]/activate` all listed under Route (app)

## Acceptance-criteria coverage

- AC-1 … covered by the add / cap / duplicate-name steps
- AC-2 … covered by the migration-applied + existing-account steps
- AC-3 … covered by the analyze-picker steps
- AC-4 … covered by the switch-active steps
- AC-5 … covered by the rename / duplicate-name steps
- AC-6 … covered by the replace-file (active vs. not active) steps
- AC-7 … covered by the delete-guardrail steps
- AC-8 … covered by the resume_id-on-analysis step
