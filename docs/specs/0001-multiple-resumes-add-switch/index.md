# 0001. Add and switch between named resumes

**Date**: 2026-10-01
**Status**: In Progress

## Summary

Today an account has exactly one resume, stored directly on its profile row. This spec lets an account store several named resumes (for example "Frontend" and "Backend") instead, and pick which one is active. Running an analysis gets an explicit picker for which resume to use, and picking one there also becomes the account's new active resume everywhere else. An account that already has a resume keeps working automatically; its existing resume becomes a named resume called "My Resume" with nothing lost.

## Requirements

**User stories**:
- As a job seeker with more than one resume, I want to add a second named resume without losing the first, so I can keep a Frontend and a Backend version side by side.
- As that same user, I want to pick which resume an analysis runs against, so a Backend job description gets matched against my Backend resume, not whichever one happened to be active.
- As an existing user who has never heard of this feature, I want my current resume to keep working with no action on my part.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: Adding a new named resume (a name plus a PDF upload) saves it without modifying or removing any other resume already on the account, up to a maximum of 5 resumes per account; a 6th attempt is rejected with a clear error.
- **AC-2**: An account that used the single resume flow before this feature shipped is migrated automatically: its existing resume becomes a named resume called "My Resume" and is set as that account's active resume, with no data loss and no action required from the user.
- **AC-3**: The New Analysis screen shows an explicit resume picker whenever the account has more than one resume, pre-selected to the currently active resume; running an analysis with a different resume selected both analyzes against that resume's text and sets it as the account's new active resume.
- **AC-4**: A user can switch which resume is active independent of running an analysis (for example from the profile page or a nav level switcher).
- **AC-5**: A user can rename an existing resume; the name must be non-empty, at most 60 characters, and unique among that account's own resumes (case-insensitive); a duplicate or invalid name is rejected with a clear error.
- **AC-6**: A user can replace an existing resume's file content by uploading a new PDF under the same resume. If the resume being replaced is the account's active resume, this also re-runs AI extraction and updates the account's shared profile fields, exactly as today's single resume replace does. If it is not the active resume, only that resume's own stored text and file metadata change.
- **AC-7**: A user can delete a named resume, except deletion is refused when it is the account's only remaining resume, or when any past analysis references it. Deleting the active resume, when it is not the only one, reassigns the active resume to the account's most recently updated remaining resume.
- **AC-8**: Every analysis created from this point on records which resume produced it.

## Decision

**Chosen option**: Option 1: A new `resumes` table, one row per named resume.

Reasoning and options: see `rationale.md`.

## Feature design

**Data model sketch**:

| Entity | Field | Type | Nullable | Notes |
|---|---|---|---|---|
| `resumes` (new) | `id` | uuid, PK | no | `default gen_random_uuid()` |
| | `user_id` | uuid, FK to `auth.users(id)` | no | `on delete cascade` |
| | `name` | text | no | unique per user, case-insensitive, max 60 chars |
| | `resume_text` | text | no | |
| | `resume_filename` | text | no | |
| | `resume_page_count` | int | no | |
| | `resume_char_count` | int | no | |
| | `created_at` | timestamptz | no | `default now()` |
| | `updated_at` | timestamptz | no | `default now()` |
| `profiles` (existing, altered) | `active_resume_id` (new) | uuid, FK to `resumes(id)` | yes | `on delete set null`; null only for an account with zero resumes |
| `job_analyses` (existing, altered) | `resume_id` (new) | uuid, FK to `resumes(id)` | yes | `on delete set null`; null for pre-feature rows or a since-deleted resume |

Relationships: `auth.users` 1 to N `resumes`. `profiles.active_resume_id` points at 0 or 1 `resumes` row. `resumes` 1 to N `job_analyses` (nullable, an analysis can outlive its resume once slice 3 changes the delete rule, though this slice blocks that case, see AC-7).

The existing `profiles.resume_text` / `resume_filename` / `resume_page_count` / `resume_char_count` columns stay in the schema, unused by the app going forward, rather than being dropped, matching the project's additive, by-hand migration convention (`supabase/AGENTS.md`).

**State transitions** (active resume):

`none` (account has zero resumes) → `active` (first resume added, or migrated from an existing account) → `active` (switch, or pick a different resume at analysis time) → reassigned to another remaining resume (when the active one is deleted, see AC-7). An account can only return to `none` if it had zero resumes to begin with; once it has one, AC-7 forbids deleting the last one, so `none` is unreachable afterward.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/resumes` | GET | — | `resume[]`: id, name, fileName, pageCount, charCount, updatedAt, isActive | session | 401 |
| `/api/resumes` | POST | name, resumeText, fileName, pageCount, charCount | `{saved: true, resume: {id, name}}` | session | 400 invalid/duplicate name, 409 cap reached (5), 401 |
| `/api/resumes/[resumeId]` | PATCH | `name?` and/or `resumeText, fileName, pageCount, charCount` | `{saved: true, resume, profile?}` (`profile` present only when extraction ran) | session, ownership | 400 invalid/duplicate name, 404 not found or not owned, 401 |
| `/api/resumes/[resumeId]` | DELETE | — | `{deleted: true, newActiveResumeId?}` | session, ownership | 404 not found or not owned, 409 last resume or has analyses, 401 |
| `/api/resumes/[resumeId]/activate` | POST | — | `{activated: true}` | session, ownership | 404 not found or not owned, 401 |
| `/api/analyze` (modified) | POST | jobDescriptionText, `resumeId` (new) | `AIAnalysisResponse` plus jobId | session | 400 resumeId missing, not found, or not owned; 401; 429; 502 |

Ownership on every `[resumeId]` route is enforced twice: row level security already scopes every `resumes` query to `auth.uid() = user_id`, and the route additionally filters its query by the authenticated user's id before acting, so a request for another account's resume id reads as a plain not found rather than depending on RLS alone (`supabase/AGENTS.md`: "Never rely on app level checks alone" cuts both ways, RLS is the enforced boundary and the app check is the defense in depth on top of it, not a replacement for it).

**Value sourcing** (every value each action produces, computes, or displays names where it comes from):

| Action | Value produced / displayed | Source |
|---|---|---|
| POST /api/resumes (add) | new resume's id | generated by the DB default |
| POST /api/resumes (add) | rejection past 5 resumes | a count of the user's existing `resumes` rows, compared against the cap (an app constant) |
| POST /api/resumes (add) | duplicate name rejection | the `resumes (user_id, lower(name))` unique index, mapped to a friendly error |
| Migration backfill | "My Resume" name for the migrated resume | a fixed default name, not user input |
| Migration backfill | which accounts get a backfilled resume | `profiles.resume_text is not null` (existing column) |
| GET /api/resumes (list) | `isActive` per resume | `profiles.active_resume_id` compared to each resume's id |
| POST /api/analyze | which resume's text feeds the prompt | `resumeId` in the request body, looked up server side, ownership checked against `auth.uid()` |
| POST /api/analyze | `job_analyses.resume_id` | the same validated `resumeId` |
| POST /api/analyze | the account's new active resume | the same validated `resumeId`; the route sets `profiles.active_resume_id` to it |
| POST /api/resumes/[id]/activate | the account's new active resume | `resumeId` in the URL, ownership checked |
| PATCH /api/resumes/[id] (file replace) | whether extraction runs | `resumeId` in the URL compared to `profiles.active_resume_id` for that user |
| DELETE /api/resumes/[id] | refusal reason (last resume vs. has analyses) | a count of the user's `resumes` rows, and a count of `job_analyses` where `resume_id` equals the target id |
| DELETE /api/resumes/[id] | reassigned active resume, when applicable | the user's remaining `resumes`, ordered by `updated_at` descending, the first row |

**Key invariants**:
- Every `resumes` row belongs to exactly one user; enforced by RLS on every operation.
- An account has between 0 and 5 resumes at all times; the cap is enforced in the API on create (a DB level check would need a trigger for little benefit at this scale).
- A resume's name is unique per account, case-insensitively; enforced by a DB unique index.
- `profiles.active_resume_id`, when set, always references a resume owned by the same account; every write path that sets it has already validated ownership of that resume.
- A `resumes` row cannot be deleted while any `job_analyses` row references it, or while it is the account's only remaining resume.

**Security model**: Same per-user isolation as the rest of the app. Row level security on `resumes` mirrors the existing `profiles`/`job_analyses` policies: select, insert, update, and delete all scoped to `auth.uid() = user_id`. No new compliance scope; resume text is handled exactly as it is today (extracted client side, the raw PDF never stored, per `supabase/schema.sql`'s existing comment).

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):
- Happy path: a user with one resume adds a second named resume, picks it on the New Analysis screen, and runs an analysis against it, verifies **AC-1**, **AC-3**, **AC-4**.
- Failure case: adding a 6th resume is rejected, verifies **AC-1**. Deleting the only remaining resume is rejected, verifies **AC-7**. Deleting a resume with analyses attached to it is rejected, verifies **AC-7**.
- Auth/permission: a crafted request to activate, rename, or delete another account's resume id returns not found and changes nothing, verifies the security model behind **AC-4**, **AC-5**, **AC-7**.
- Migration: an account that used the app before this feature shipped opens `/profile` after the migration runs and sees one resume named "My Resume", already active, with everything else unchanged, verifies **AC-2**.

## Build plan

1. [ ] Write and run `supabase/add-resumes-table.sql`: create the `resumes` table, its RLS policies, and the unique name index; add `profiles.active_resume_id` and `job_analyses.resume_id`; backfill every account with a non-null `resume_text` into a "My Resume" row and set it active, satisfies **AC-2**. **File written, not yet applied** — this project has no Supabase CLI or service role key configured (`supabase/AGENTS.md`: every migration is run by hand in the SQL Editor), so `/develop` cannot run it. Run `supabase/add-resumes-table.sql` in the Supabase SQL Editor before anything below can work against real data.
2. [x] Add the `Resume` type to `types/db.ts` and extend `Profile` and `JobAnalysisRow` with the new fields, satisfies **AC-2**, **AC-8**.
3. [x] Build `GET /api/resumes` and `POST /api/resumes` (list and add, with the 5 resume cap and the unique name check), satisfies **AC-1**.
4. [x] Replace `ResumeManager` with a resume list view on `/profile` that lists resumes and can add a new one, proving the thinnest end to end add path works before layering on the rest, satisfies **AC-1**.
5. [x] Build `POST /api/resumes/[resumeId]/activate` and an active resume switcher (on the profile page and in `AppNav`), satisfies **AC-4**.
6. [x] Modify `POST /api/analyze` to require and validate `resumeId`, use that resume's text, persist `job_analyses.resume_id`, and set it active; add the resume picker to the New Analysis screen, satisfies **AC-3**, **AC-8**.
7. [x] Build `PATCH /api/resumes/[resumeId]` for rename and file replace, including the active-only extraction rule, and its UI, satisfies **AC-5**, **AC-6**.
8. [x] Build `DELETE /api/resumes/[resumeId]` with the last-resume and has-analyses guardrails and active reassignment, and its UI, satisfies **AC-7**.
9. [x] Update the empty state copy on `/analyze` and the intro copy on `/profile` to reflect the multi resume model, satisfies **AC-1**, **AC-3**.

Tasks 2 to 9 are code complete: every file is written, the project typechecks (`npx tsc --noEmit`), lints clean, and `npm run build` succeeds with every new route registered. None of it has been exercised against a real database yet, because task 1 is not applied (see above) — treat the feature as code complete but functionally unverified until the migration runs.

## Consequences

**Positive**:
- Unblocks slice 2 (per resume profile editing) and slice 3 (per-analysis resume display) without another shape change to the core tables.
- Every new access rule follows a pattern already proven in this codebase (RLS scoped by `auth.uid()`), so there is no new security model to learn or review.
- The migration only adds columns and rows; it never touches or drops existing data, so it is safe to re-run and cheap to roll back.

**Negative / tradeoffs**:
- Three tables now cooperate to answer "what is my resume" (`resumes`, `profiles.active_resume_id`, `job_analyses.resume_id`) instead of one; slightly more to hold in mind than today's single row.
- "Extraction only runs when the active resume's file changes" is a subtle rule a future contributor could miss when touching `PATCH /api/resumes/[resumeId]`; worth a comment at the call site.
- A resume that has ever been analyzed can never be deleted without first removing those analyses, which may surprise a user expecting a plain delete.

**Neutral**:
- `profiles.resume_text` and its sibling columns remain in the schema, unused after this ships; a later cleanup migration can drop them once this feature is proven.
- The command palette and the standalone Generate Resume flow are unchanged by this slice.

## Follow-up

- [ ] Run `supabase/add-resumes-table.sql` in the Supabase SQL Editor, then confirm the steps in `verify.md`.
- [ ] Slice 3 ("pick a resume when analyzing or generating") should surface the `job_analyses.resume_id` this slice starts recording as a resume name on the dashboard and job detail page.
- [ ] Generate Resume does not get a resume picker in this slice, since it reads the still-shared structured profile fields rather than resume text directly; revisit alongside slice 2 once those fields split per resume.
- [ ] Consider a follow-up migration to drop the now-unused `profiles.resume_text`, `resume_filename`, `resume_page_count`, and `resume_char_count` columns once this feature has run in production for a while.

## Migration plan

**Strategy**: no migration needed beyond a single additive, by-hand SQL file plus one coordinated app deploy; no code freeze, no dual-write phase (a low traffic, single instance deployment per `lib/AGENTS.md`'s existing note on `checkRateLimit`).

**Phases**:
1. Run `supabase/add-resumes-table.sql` in the Supabase SQL editor: create `resumes` and its RLS policies and unique index, add `profiles.active_resume_id` and `job_analyses.resume_id`, and backfill every account with a non-null `profiles.resume_text` into a "My Resume" row, activating it. Guard the backfill insert with a `not exists` check so the file is safe to re-run, matching the project's existing migration style.
2. Deploy the application code from the build plan above (new API routes, the modified analyze route, the updated UI) in the same release as step 1; the old single-resume code paths read only `profiles`, so there is no window where new and old code disagree about where the resume lives.

**Rollback**: reverting the app deploy alone is a safe rollback, the migration never alters or drops `profiles.resume_text` or any other existing column, so the old single-resume code keeps working unmodified against that original data. If the new table or columns need to be undone entirely, they can be dropped without touching the original profile data.

**Risks**: running the backfill twice would create a duplicate "My Resume" row for an account already migrated; mitigated by the `not exists` guard in step 1. A resume text longer than the 20,000 character cap the original single-resume save path already enforced is already rejected today, so the backfill (which only copies already-saved, already-validated text) cannot violate it.
