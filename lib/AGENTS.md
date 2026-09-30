# lib

## Overview

Server side utilities: the Groq AI client (structured output calls, prompt builders), client side PDF text extraction, and a lightweight rate limiter kept in memory. No React components live here.

## Key files

| File | Owns |
|---|---|
| `groq-client.ts` | All Groq calls: model fallback chain, error classification, prompt builders (`buildAnalysisPrompt`, `buildTailoredResumePrompt`), structured output helpers |
| `pdf-parser.ts` | Client side PDF text extraction via `pdfjs-dist` |
| `rate-limit.ts` | Fixed window rate limiter kept in memory (`checkRateLimit`) |
| `supabase/` | Browser/server Supabase client factories |
| `utils.ts` | Small shared helpers (`cn`, `getScoreColor`) |

## Conventions

- Only 3 Groq models support `strict: true` structured outputs: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` (see `FALLBACK_MODELS`/`MODEL_CANDIDATES`). `GROQ_MODEL` env var, if set, is tried first.
- Errors are classified into typed classes (`GroqRateLimitError`, `GroqUpstreamError`, `GroqInvalidOutputError`, `GroqTransientError`) so callers can decide whether to retry, surface a 429, or give up. Don't catch Groq errors as a generic `Error`.
- `extractCandidateProfile()` never throws (best effort, returns `null` on failure). The tailored resume style generators are expected to throw, since those are user initiated actions.
- `pdf-parser.ts` uses a dynamic `import('pdfjs-dist')` inside the parse function, not a static top level import. A static import makes Next prerender the module server side and throws an SSR warning.

## Gotchas

- `checkRateLimit()` runs in memory, one instance per process. It is not distributed. Fine for a single instance deploy (e.g. one Vercel Hobby instance); would silently stop working as a real limiter across multiple instances.
- `.cleanup()`, not `.destroy()`, to release a `PDFDocumentProxy`.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
