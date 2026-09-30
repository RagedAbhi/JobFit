# supabase

## Overview

Postgres schema and Row Level Security policies for the `profiles` and `job_analyses` tables, plus every incremental migration since the base schema. There is no migration tool (no Supabase CLI or Prisma migrate); every file here is run by hand.

## Key files

| File | Owns |
|---|---|
| `schema.sql` | Base schema: `profiles`, `job_analyses` tables, RLS policies, the `handle_new_user` trigger that auto-creates a blank profile row on signup |
| `add-full-name.sql` | Adds `profiles.full_name` |
| `add-profile-fields.sql` | Adds `headline`/`skills`/`years_experience`/`summary` |
| `add-profile-fields-v2.sql` | Adds `email`/`phone`/`location`/`links`/`work_experience`/`education`/`certifications`/`projects` |
| `add-tailored-resume.sql` | Adds `job_analyses.tailored_resume` + the missing UPDATE RLS policy needed to persist it |

## Conventions

- New schema changes are a new `add-<name>.sql` file, never an edit to an already shipped migration. Run once, by hand, in the Supabase SQL Editor, in the order they were added.
- Every table has RLS enabled. A new table or column needs its own `using (auth.uid() = user_id)` style policy per operation (select/insert/update/delete); an app level check is not a substitute.

## Gotchas

- `PGRST204: Could not find the '<column>' column` can mean either a stale PostgREST schema cache or a genuinely missing column (the migration was never run). Verify which with a direct REST query using explicit `?select=` columns. Don't assume "reload schema cache" fixes it.
- Adding a JSON style column (e.g. `tailored_resume jsonb`) usually also needs a new UPDATE policy. `schema.sql` originally only had select/insert/delete policies on `job_analyses`.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
