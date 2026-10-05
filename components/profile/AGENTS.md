# components/profile

## Overview

The `/profile` page's client side: the resume list/switcher and the shared, editable profile fields (name, skills, experience, etc.) that stay in sync with whichever resume is active.

## Key files

| File | Owns |
|---|---|
| `ProfilePageClient.tsx` | Top level client component; owns the editable field state and the `editorKey` remount trick (see Gotchas) |
| `ResumeList.tsx` | Add/rename/replace/delete/activate a resume; renders `AddResumeForm` and `ResumeRow` |
| `ProfileEditor.tsx` | The editable form for the shared profile fields; exports `toEditableFields`/`fromCandidateProfile` converters |
| `ProfileCompleteness.tsx` | The completeness ring shown above the form |

## Conventions

- `ResumeList`'s `onExtracted` callback is how a freshly re-extracted `CandidateProfile` (from `PATCH .../[resumeId]` replacing the active resume's file, or `POST .../activate` switching to a different resume) reaches `ProfilePageClient`'s form state. Any new action that can change which resume is active, or re-extract profile fields, must thread its API response's `profile` field through this same callback.

## Gotchas

- **`ProfilePageClient`'s `fields` state does not auto refresh from a server re-render.** It's seeded from the `initialProfile` prop via `useState(() => toEditableFields(initialProfile))` — React only runs that initializer once, so a `router.refresh()` that gives the component new props does *not* update already-mounted state. The fix in place is `onExtracted`, which calls `setFields` directly and bumps `editorKey` to force `ProfileEditor` to remount with the new values (losing any in-progress unsaved edits, which is the intended trade-off — a resume switch should win over a stale draft). Skipping `onExtracted` for a new activation/extraction path silently leaves the form showing stale data even though the underlying `profiles` row changed.
- `ResumeList`'s `showAdd` defaults to `true` only when `resumes.length === 0` — the add form auto opens for a brand new account, but stays collapsed afterward even if the account later drops to zero resumes through some other path (not currently reachable, since deleting the last resume is blocked server side).

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
