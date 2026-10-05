# Scope: Jobfit

An AI resume to job description matcher. Upload a resume once, run it against job descriptions, get a match score with a skills breakdown and improvement suggestions, all saved to a dashboard. Built as a portfolio piece, free tier only, one developer.

**Build approach:** Tracer Bullet (each feature built as one complete slice through every layer, working end to end, the same way this app has been built so far).
**Workflow:** Alpha (after building, run `/check verify` against the real running app; no separate test suite or second model review by default).

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Authentication | Existing | existing |
| B | Profile and resume upload | Existing | existing |
| C | Job description match analysis | Existing | existing |
| D | Dashboard | Existing | existing |
| E | Job detail view | Existing | existing |
| F | Tailored resume generation and editing | Existing | existing |
| G | Standalone generate resume flow | Existing | existing |
| H | Command palette | Existing | existing |
| I | Theme toggle | Existing | existing |
| J | Branding and metadata | Existing | existing |
| 1 | Multiple resumes: add and switch between named resumes | Slice 1 | in-progress |
| 2 | Multiple resumes: per resume profile editing | Slice 2 | planned |
| 3 | Multiple resumes: pick a resume when analyzing or generating | Slice 3 | planned |
| 4 | Rebrand to Jobfit | Rebrand | done |

## Existing

### A. Authentication · existing
Email and password sign up, sign in, and session handling. code in `app/login/`, `app/signup/`, `app/auth/`, `proxy.ts`

### B. Profile and resume upload · existing
Upload a resume once (parsed client side, never leaves as a raw file), AI extracts structured fields, and the user can edit everything by hand, with a completeness indicator. code in `app/profile/`, `components/profile/`, `app/api/profile/`

### C. Job description match analysis · existing
Paste a job description, get an AI match score, a skills matrix, and improvement suggestions, saved to the dashboard. code in `app/analyze/`, `components/analyze/`, `app/api/analyze/`

### D. Dashboard · existing
Every past analysis as a card, a stats row with animated counts, a get started checklist for new accounts, and delete. code in `app/dashboard/page.tsx`, `components/dashboard/`

### E. Job detail view · existing
The full match breakdown for one analysis: score gauge, skills matrix, suggestions, the original job description. code in `app/dashboard/[jobId]/page.tsx`

### F. Tailored resume generation and editing · existing
AI rewrites the resume for one specific job, viewable as a printable page, directly editable in place, and copyable as plain text. code in `app/dashboard/[jobId]/resume/`, `components/resume/`, `app/api/jobs/[jobId]/tailored-resume/`

### G. Standalone generate resume flow · existing
Paste a job description and go straight to a tailored resume, without reviewing the match score first. code in `app/generate-resume/`

### H. Command palette · existing
A keyboard shortcut opens quick navigation plus a search over past analyses. code in `components/command/`, `app/api/jobs/route.ts`

### I. Theme toggle · existing
A manual light or dark switch, on top of the app's dark first default. code in `components/layout/ThemeToggle.tsx`, `app/globals.css`

### J. Branding and metadata · existing
Favicon, app icon, a real Open Graph image for link previews, and a custom not found page. code in `app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx`, `app/twitter-image.tsx`, `app/not-found.tsx`

## Slice 1: Multiple resumes: add and switch between named resumes

### 1. Multiple resumes: add and switch between named resumes · Beta
Let a user store more than one named resume (for example "Frontend" and "Backend") instead of today's one resume per account, and pick which one is active. The resume already on an existing account becomes that account's first named resume automatically, with nothing lost.
**Done when:** a user can add a second named resume without losing the first; the new analysis flow lets them pick which resume to match against; an account that only ever had one resume keeps working with no action needed on its owner's part.
spec [0001](../specs/0001-multiple-resumes-add-switch/index.md) · code in `app/api/resumes/`, `components/profile/ResumeList.tsx`, `components/layout/ResumeSwitcher.tsx`, `components/analyze/AnalyzeFlow.tsx`, `supabase/add-resumes-table.sql`
- [x] Design it (spec): `/architect multiple resumes: add and switch between named resumes`
- [ ] Build it: `/develop multiple resumes: add and switch between named resumes` — `supabase/add-resumes-table.sql` has been run; migration, listing/adding, switching, and the analysis picker are runtime verified. Rename/replace/delete are not yet exercised.
  - [x] Resumes table migration, plus listing and adding a named resume, satisfies AC-1, AC-2
  - [x] Active resume switching, satisfies AC-4
  - [x] Resume picker on the New Analysis screen, satisfies AC-3, AC-8
  - [ ] Rename, replace, and delete a resume, satisfies AC-5, AC-6, AC-7
- [ ] Verify it: `/check verify multiple resumes: add and switch between named resumes`
- [ ] Test it: `/test multiple resumes: add and switch between named resumes`

## Slice 2: Multiple resumes: per resume profile editing

### 2. Multiple resumes: per resume profile editing · needs a decision
Extend the structured profile editor (skills, work experience, education, and the rest) to belong to one named resume instead of one shared profile, so each resume can be tailored on its own.
**Done when:** editing the skills on "Frontend" does not change "Backend"; the profile editor always shows which resume is currently open.
- [ ] Design it (spec): `/architect multiple resumes: per resume profile editing`

## Slice 3: Multiple resumes: pick a resume when analyzing or generating

### 3. Multiple resumes: pick a resume when analyzing or generating · needs a decision
The paste a job description flow, the standalone generate resume flow, and the command palette all ask which resume to use, instead of assuming there is only one.
**Done when:** starting an analysis asks which resume to use once an account has more than one; each saved analysis remembers which resume it used; the dashboard and job detail page show that resume's name.
- [ ] Design it (spec): `/architect multiple resumes: pick a resume when analyzing or generating`

## Rebrand

### 4. Rebrand to Jobfit
Replace every user facing and project level instance of the current name ("Resume Matcher" / "Resume Parser" / "AI Resume Screener & ATS Matcher") with "Jobfit": nav/page titles, metadata (OpenGraph/Twitter image, app icon alt text), `README.md`, and `package.json`'s `name` field.
**Done when:** no user facing or project level string still reads the old name, and the app still builds, lints, and runs clean under the new one.
- [x] Build it: `/develop rebrand to jobfit` — renamed in README.md, package.json (+ package-lock.json via `npm install`), AGENTS.md, docs/scope/scope.md, app/layout.tsx (page title/metadata), components/layout/AppNav.tsx (nav brand), lib/og-image.tsx (OG/Twitter image). Lint, typecheck, tests, and build all verified clean after. README's screenshots recaptured against the live app to show "Jobfit" in the nav.

## Deferred
Out of scope for this pass, kept so the plan stays honest.
- **Cover letter generator**: reuse the existing tailored resume pattern (same AI plumbing, same view and editor split) to draft a cover letter per job · needs a decision
- **Bulk analyze**: paste several job descriptions at once and get a ranked list back · needs a decision
- **Toast notifications**: a general popup notification system in place of the current fixed error banner · not decided, low value for now
- **Drop the unused single-resume profile columns**: once spec [0001](../specs/0001-multiple-resumes-add-switch/index.md) has run in production a while, drop `profiles.resume_text`/`resume_filename`/`resume_page_count`/`resume_char_count`, left in place unused by that migration · low value until then

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` plus 2 to 5 milestones; the tier's closing boxes (`Verify it` at Alpha and above); any surfaced follow up enrolled |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` plus milestones ticked; `Verify it` ticked |
| `done` | you, when you decide it is (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; at Alpha the suggested point to call it done is after `/check verify`; `/sync` captures conventions |

- **Next step** = the first unticked box, always a command or a tracked milestone.
- **needs a decision** = run `/architect` first; otherwise straight to `/develop`. The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` then `in-progress` then `done`, plus `existing` (pre workflow) and `dropped` (de scoped, kept for history).
- **Workflow tier tag** beside a heading (e.g. `· Beta`) sets that one feature's rigor above or below the project default; no tag inherits the default.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing (trust develop's own build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
