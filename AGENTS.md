<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Jobfit

## Stack

- **Language / Runtime**: TypeScript, Node.js
- **Framework**: Next.js 16.3.8 (App Router, Turbopack, React 19.3)
- **Key dependencies**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`) for Postgres + Auth, `groq-sdk` for AI calls, `zod` for schema validation, Tailwind CSS v4, `cmdk` (command palette), `framer-motion`, Vitest for tests
- **Package manager**: npm
- **Declined tooling**: an Agent Skill/MCP search for Vitest was declined (see `/sync`) — don't re-offer unless asked.

## Build approach

Tracer Bullet: each feature is built as one complete slice through every layer, working end to end (see `docs/scope/scope.md`).

## Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Test
npm test
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Server Components by default; add `'use client'` only where interactivity is actually needed.
- Every API route returns the shared `ApiResponse<T>` discriminated union (`types/analysis.ts`) via a local `jsonError()` helper, and calls `checkRateLimit()` (`lib/rate-limit.ts`) on any route that costs an AI call or lets a user mutate data.
- Groq's structured output JSON schemas are derived from the same Zod schemas used to validate the response (`z.toJSONSchema()` in `lib/groq-client.ts`), so the AI contract and the safety net validator can't drift apart.
- Tailwind v4, no `tailwind.config.js`. Theme lives in `app/globals.css` as CSS custom properties (OKLCH, dark first) inside an `@theme inline` block. `data-theme="light"` on `<html>` overrides OS preference (see `components/layout/ThemeToggle.tsx`).
- `proxy.ts` is Next 16's renamed `middleware.ts`, same signature, new file and export name (`export async function proxy`). It redirects unauthenticated requests to `/login`; API routes are exempt and return their own 401 JSON.
- Postgres Row Level Security (`supabase/schema.sql`) enforces data isolation per user. Never rely on app level checks alone.
- Always pass `'en-US'` explicitly to `toLocaleDateString`/`toLocaleString`. Omitting it causes server/client hydration mismatches.
- Supabase errors: log with `JSON.stringify(error, Object.getOwnPropertyNames(error))`, not a plain `console.error(error)`. `PostgrestError` can otherwise serialize as `"{}"`.
- The shared profile fields (name, skills, experience, etc.) always resync with whichever resume is active: switching it, analyzing against a different one, or replacing the active resume's file all re-run AI extraction and update `profiles`, best effort and non blocking (never throws, a failure just leaves the fields untouched). See `app/api/resumes/AGENTS.md`.

## Context files

- [lib/AGENTS.md](lib/AGENTS.md): Groq AI integration conventions, PDF parsing and rate limiting gotchas
- [supabase/AGENTS.md](supabase/AGENTS.md): manual, ordered SQL migration workflow
- [app/api/resumes/AGENTS.md](app/api/resumes/AGENTS.md): multi resume CRUD, activation, and the extraction timing rules that keep the shared profile in sync
- [components/profile/AGENTS.md](components/profile/AGENTS.md): resume list/switcher UI and the client state gotcha around re-extraction

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
