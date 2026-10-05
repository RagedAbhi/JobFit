# app/api/resumes

## Overview

CRUD and activation for an account's named resumes (up to 5), the pieces that make the multi resume model work: listing, adding, renaming/replacing, deleting, and switching which one is active.

## Key files

| File | Owns |
|---|---|
| `route.ts` | `GET` lists resumes with `isActive` flags; `POST` adds a new one (name + already client parsed text), enforcing the 5 resume cap and the unique name check |
| `[resumeId]/route.ts` | `PATCH` renames and/or replaces a resume's file content; `DELETE` removes one, with guardrails |
| `[resumeId]/activate/route.ts` | `POST` switches which resume is the account's active one |

## Conventions

- A resume name is unique per account, case insensitively, max 60 characters; enforced by a DB unique index on `(user_id, lower(name))`, surfaced as `INVALID_REQUEST` on the Postgres `23505` violation code, not a generic 500.
- `MAX_RESUMES_PER_ACCOUNT = 5`, checked with a `count` query before insert, not a DB trigger (small scale, app level check is enough).
- Every `[resumeId]` route re-checks `user_id` ownership itself, even though RLS already scopes the query — a request for another account's resume id reads as a plain 404, never a 403 (see `supabase/AGENTS.md`: never rely on app level checks alone, this is the app level layer on top of RLS, not instead of it).
- Deleting a resume is refused when it is the account's only remaining one, or when any `job_analyses` row still references it; deleting the active resume reassigns `active_resume_id` to the most recently updated remaining resume.

## Gotchas

- **Extraction timing**: the shared `profiles` fields (name, skills, experience, etc.) only resync from AI extraction (`extractCandidateProfile()` in `lib/groq-client.ts`) when the *active* resume's content changes or when the active resume itself changes — specifically: `PATCH` replacing the active resume's file, `POST .../activate` switching to a different resume, and `POST /api/analyze` implicitly switching the active resume (it also must re-extract, same as explicit activate). All three paths skip extraction, and leave `profiles` untouched, when the target resume is already active or extraction itself fails (`extractCandidateProfile` never throws, returns `null` on failure, treated as best effort). Missing this on any one of the three paths quietly desyncs "which resume is active" from "what the Profile page shows" — this has been the single most common bug in this feature.
- The client side counterpart matters too: a server re-render (`router.refresh()`) alone does not update an already mounted client component's local state (see `components/profile/AGENTS.md`); any route here that changes the shared profile fields must return the extracted `profile` in its response so the caller can push it into client state directly.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
