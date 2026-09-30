## Context

The `profiles` table is one row per user (`id = auth.users.id`), holding both the raw resume (`resume_text`, `resume_filename`, page and character counts) and the structured fields an AI extraction step fills in (skills, work experience, education, and the rest). Every page that needs "the resume" (`/analyze`, `/api/analyze`, `/generate-resume`, `/profile`) reads this single row with `.from('profiles').select('*').single()`.

That one-to-one shape cannot represent "I have a resume tailored for frontend roles and a different one for backend roles." Adding a second resume today means overwriting the first: `ResumeManager`'s "Replace resume" action re-extracts and overwrites the same row. There is no notion of more than one resume, no way to name one, and no way to keep several around.

This is the first of three planned slices (scope rows 1 to 3). This slice only introduces the container (named resumes, an active one, an explicit pick at analysis time) and keeps the structured profile fields shared across all of an account's resumes; splitting those per resume is slice 2's job, and showing which resume produced a past analysis on the dashboard and job detail page is slice 3's job. Building the full per resume profile now would pull that work forward into a single large change; splitting it keeps each slice small enough to build, verify, and ship on its own, in line with the project's tracer bullet approach.

## Options considered

### Option 1: A new `resumes` table, one row per named resume

A new table holds one row per named resume (name, resume text, file metadata), owned by a user. `profiles` keeps the structured fields shared for now and gains a pointer to which resume is active. `job_analyses` gains a pointer to which resume produced it.

**Pros**:
- Clean relational shape: a real one-to-many relationship, proper foreign keys, an account's resume count is a simple row count, deleting one is a normal delete with referential guardrails.
- Row level security follows the exact pattern already used for `profiles` and `job_analyses` (`auth.uid() = user_id`); nothing new to learn.
- Leaves the door open for slice 2 to add the structured fields to this same table without another shape change.

**Cons**:
- A new table and a new by-hand migration to run, plus a data backfill for every existing account.

### Option 2: Store resumes as a JSON array on the existing `profiles` row

Add a `resumes jsonb` column holding an array of `{name, text, fileName, ...}` objects, with an `active_index` alongside it.

**Pros**:
- No new table, no new migration file beyond one `alter table`.

**Cons**:
- No foreign key from `job_analyses` to a specific resume; "which resume produced this analysis" becomes an unenforced array index or a duplicated name string.
- No per-resume row level security, no DB level uniqueness or count constraints; every rule (cap, unique name, delete guardrails) has to be reimplemented in application code reading and rewriting the whole array.
- Update races: two tabs editing the same JSON array can silently clobber each other's changes; a relational table isolates each resume's row.

### Option 3: Split the full per-resume profile now (combine with slice 2)

Duplicate the entire `profiles` row (including skills, work experience, education, and so on) per named resume immediately, rather than keeping those fields shared until slice 2.

**Pros**:
- Avoids a second schema change later; slice 2 would have nothing left to do.

**Cons**:
- Pulls slice 2's whole scope into this spec: the profile editor, every place that reads structured fields, and the extraction flow would all need to become resume aware at once, a much larger and riskier change than "add and switch."
- Works against the project's own slicing (scope rows 1 to 3 exist precisely to keep this buildable in stages).

## Rationale

The data has a real one-to-many shape (one account, several resumes), and Option 1 is the only option that lets the database enforce that shape: a foreign key from `job_analyses.resume_id`, a unique index for the name rule, and row level security reusing the exact `auth.uid() = user_id` pattern already on `profiles` and `job_analyses`. Option 2's JSON array would have to reimplement every one of those guarantees by hand inside application code, which is both more code and more fragile than the columns and constraints Postgres already gives for free. Option 3 is the right eventual end state but not for this slice: the scope explicitly splits "add and switch" from "per resume profile editing" (slice 2) so each ships as a small, independently verifiable change, and Option 1's shape does not foreclose Option 3 later, it is a strict subset of it.
