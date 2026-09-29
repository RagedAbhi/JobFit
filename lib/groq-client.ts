import Groq, { APIError, InternalServerError, RateLimitError } from 'groq-sdk';
import { z } from 'zod';
import { AIAnalysisResponseSchema } from '@/schemas/ai-response.schema';
import { CandidateProfileSchema, type CandidateProfile } from '@/schemas/candidate-profile.schema';
import { TailoredResumeSchema } from '@/schemas/tailored-resume.schema';
import type { WorkExperienceEntry, EducationEntry } from '@/schemas/candidate-profile.schema';

function toBareJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const full: Record<string, unknown> = { ...z.toJSONSchema(schema) };
  delete full.$schema;
  return full;
}

// Auto-derived from the same Zod schema we validate the parsed response
// against, so the two can never drift out of sync (Groq's json_schema mode
// takes real JSON Schema -- z.toJSONSchema() produces exactly that). The
// $schema meta-key is stripped since Groq's `schema` field expects a bare
// schema object, not a self-describing document.
const RESPONSE_JSON_SCHEMA = toBareJsonSchema(AIAnalysisResponseSchema);

const CANDIDATE_PROFILE_JSON_SCHEMA = toBareJsonSchema(CandidateProfileSchema);
const TAILORED_RESUME_JSON_SCHEMA = toBareJsonSchema(TailoredResumeSchema);

// Only a handful of Groq models currently support `strict: true` structured
// outputs (console.groq.com/docs/structured-outputs#supported-models,
// verified live): the two GPT-OSS sizes and Qwen 3.8 27B. Tried in order
// (largest/best reasoning first) until one succeeds -- see the classifyError
// comment below for why a candidate is skipped vs. failed immediately.
// GROQ_MODEL, if set, is tried first, ahead of this list.
const FALLBACK_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
const MODEL_CANDIDATES = process.env.GROQ_MODEL
  ? [process.env.GROQ_MODEL, ...FALLBACK_MODELS.filter((m) => m !== process.env.GROQ_MODEL)]
  : FALLBACK_MODELS;

// Bounds each individual call so a slow/overloaded model can't hang past
// Vercel's function timeout without us ever getting a chance to fall back
// or return a structured error. Kept short since a single call may try
// every candidate in MODEL_CANDIDATES in one request -- worst case is
// MODEL_CANDIDATES.length x this value, which needs to stay comfortably
// under maxDuration (see app/api/analyze/route.ts).
const PER_CALL_TIMEOUT_MS = 10000;

export function buildAnalysisPrompt(resumeText: string, jobDescriptionText: string): string {
  return `You are an expert ATS (Applicant Tracking System) resume screener.

Compare the RESUME against the JOB DESCRIPTION below and produce a strict JSON
analysis. Be specific and concrete — cite actual skills/technologies named in
either text, don't invent generic filler.

Scoring guidance:
- jobTitle: a short, concise title for this role inferred from the job
  description (e.g. "React Frontend Developer"), used as a display label --
  infer one even if the JD doesn't state it explicitly.
- matchScore: 0-100 holistic fit score. Weight critical/required skills far
  more heavily than nice-to-haves.
- matchingSkills: skills/requirements present in BOTH texts.
- missingSkills: skills explicitly required by the JD that are absent from
  the resume (critical gaps).
- optionalMissingSkills: JD skills marked as preferred/bonus/nice-to-have
  that are absent from the resume (non-blocking gaps).
- improvementSuggestions: concrete, categorized actions the candidate could
  take to improve their ATS match (e.g. add a missing keyword, quantify an
  achievement, reformat a section).
- summary: 2-4 sentence plain-English verdict.

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescriptionText}
`;
}

export class GroqRateLimitError extends Error {}
export class GroqUpstreamError extends Error {}
/** Groq responded, but the text wasn't valid JSON — treated like a Zod
 * validation failure by the caller (worth one retry), not a fatal error. */
export class GroqInvalidOutputError extends Error {}
/** Every candidate model was transiently unavailable (5xx, or a connection
 * timeout). Distinct from a 429 quota error: this is Groq's infrastructure
 * being overloaded, not the caller's quota. */
export class GroqTransientError extends Error {}

type ErrorKind = 'rate_limit' | 'transient' | 'fatal';

function classifyError(err: unknown): ErrorKind {
  if (err instanceof RateLimitError) return 'rate_limit';
  if (err instanceof InternalServerError) return 'transient';
  if (err instanceof APIError && err.status === undefined) return 'transient'; // connection/timeout errors carry no HTTP status
  return 'fatal';
}

/**
 * Calls Groq with strict structured-output JSON mode, trying each model in
 * MODEL_CANDIDATES in turn until one succeeds, and returns the parsed (but
 * not yet Zod-validated) response.
 *
 * Throws GroqRateLimitError only if every candidate hit a 429, or
 * GroqTransientError if every candidate was overloaded/timed out (a mix of
 * the two is reported as transient, since that's the more actionable/
 * retry-friendly message for the user). A fatal error (bad key, etc.) on any
 * candidate is thrown immediately as GroqUpstreamError without trying the
 * rest, since it isn't model-specific. Throws GroqInvalidOutputError if a
 * model that did succeed returned text that isn't valid JSON.
 */
async function callGroqStructured(
  prompt: string,
  schemaName: string,
  jsonSchema: Record<string, unknown>,
  maxCompletionTokens = 2000
): Promise<unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqUpstreamError('GROQ_API_KEY is not configured on the server.');
  }

  const groq = new Groq({ apiKey, timeout: PER_CALL_TIMEOUT_MS, maxRetries: 0 });

  let rawText: string | null | undefined;
  let sawTransient = false;
  let sawRateLimit = false;

  for (const model of MODEL_CANDIDATES) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_completion_tokens: maxCompletionTokens,
        response_format: {
          type: 'json_schema',
          json_schema: { name: schemaName, schema: jsonSchema, strict: true },
        },
      });
      rawText = completion.choices[0]?.message.content;
      break; // success -- stop trying further candidates
    } catch (err) {
      const kind = classifyError(err);
      const message = err instanceof Error ? err.message : String(err);
      if (kind === 'rate_limit') {
        sawRateLimit = true;
        continue;
      }
      if (kind === 'transient') {
        sawTransient = true;
        continue;
      }
      // Fatal, not model-specific (e.g. bad API key) -- no point trying the
      // next candidate.
      throw new GroqUpstreamError(message);
    }
  }

  if (rawText === undefined) {
    if (sawTransient) {
      throw new GroqTransientError('All candidate models were overloaded or timed out.');
    }
    if (sawRateLimit) {
      throw new GroqRateLimitError('Groq API rate limit or quota exceeded.');
    }
    throw new GroqUpstreamError('Groq returned an empty response.');
  }

  if (!rawText) {
    throw new GroqUpstreamError('Groq returned an empty response.');
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new GroqInvalidOutputError('Groq returned malformed JSON.');
  }
}

export async function callGroqForAnalysis(prompt: string): Promise<unknown> {
  return callGroqStructured(prompt, 'resume_analysis', RESPONSE_JSON_SCHEMA);
}

export interface TailoredResumeInput {
  fullName: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: string[];
  summary: string | null;
  skills: string[];
  workExperience: WorkExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
}

function formatProfileForPrompt(profile: TailoredResumeInput): string {
  const lines: string[] = [];
  lines.push(`Name: ${profile.fullName ?? 'Unknown'}`);
  if (profile.headline) lines.push(`Headline: ${profile.headline}`);
  if (profile.email) lines.push(`Email: ${profile.email}`);
  if (profile.phone) lines.push(`Phone: ${profile.phone}`);
  if (profile.location) lines.push(`Location: ${profile.location}`);
  if (profile.links.length) lines.push(`Links: ${profile.links.join(', ')}`);
  if (profile.summary) lines.push(`\nSummary: ${profile.summary}`);
  if (profile.skills.length) lines.push(`\nSkills: ${profile.skills.join(', ')}`);

  if (profile.workExperience.length) {
    lines.push('\nWork Experience:');
    for (const job of profile.workExperience) {
      lines.push(`- ${job.title} at ${job.company} (${job.startDate ?? '?'} - ${job.endDate ?? '?'})`);
      if (job.description) lines.push(`  ${job.description}`);
    }
  }

  if (profile.education.length) {
    lines.push('\nEducation:');
    for (const edu of profile.education) {
      const degreeLine = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ');
      lines.push(`- ${edu.institution}${degreeLine ? ` — ${degreeLine}` : ''} (${edu.startDate ?? '?'} - ${edu.endDate ?? '?'})`);
    }
  }

  if (profile.certifications.length) {
    lines.push(`\nCertifications: ${profile.certifications.join(', ')}`);
  }

  return lines.join('\n');
}

export function buildTailoredResumePrompt(profile: TailoredResumeInput, jobDescriptionText: string): string {
  return `You are an expert resume writer. Rewrite the candidate's resume below to target the specific job description, using ONLY information present in the candidate's original profile -- never invent employers, titles, dates, skills, or achievements that aren't there.

What to change:
- headline: rewrite to match the target role's title/focus.
- summary: rewrite (2-4 sentences) to foreground the candidate's experience most relevant to this job.
- skills: reorder so the skills most relevant to the job description come first; you may omit clearly irrelevant ones, but do not add skills the candidate doesn't have.
- workExperience: for each role, rewrite the description into 2-4 concise, achievement-focused bullet points, phrased to highlight relevance to the target job where the original content genuinely supports it. Do not fabricate metrics or responsibilities not implied by the original.
- education, certifications: carry over as-is (fix formatting only, don't invent).

--- CANDIDATE PROFILE ---
${formatProfileForPrompt(profile)}

--- TARGET JOB DESCRIPTION ---
${jobDescriptionText}
`;
}

/**
 * Generates a resume tailored to a specific job description from the
 * candidate's stored profile. Unlike extractCandidateProfile (best-effort,
 * never throws), this is a deliberate user-initiated action -- callers
 * should catch GroqRateLimitError/GroqTransientError/GroqInvalidOutputError/
 * GroqUpstreamError and surface a clear message rather than silently
 * degrading.
 */
export async function callGroqForTailoredResume(prompt: string): Promise<unknown> {
  return callGroqStructured(prompt, 'tailored_resume', TAILORED_RESUME_JSON_SCHEMA, 3500);
}

/**
 * Best-effort extraction of a full structured profile (contact info,
 * headline, summary, skills, work history, education, certifications,
 * projects) from resume text, used to pre-fill the editable profile form on
 * /profile so the user isn't starting from a blank page. Never throws --
 * returns null on total failure (e.g. Groq unreachable), which the caller
 * treats as "leave existing profile fields untouched" rather than
 * clobbering them with empty values.
 */
export async function extractCandidateProfile(resumeText: string): Promise<CandidateProfile | null> {
  const prompt = `Extract a complete, structured professional profile from the resume text below. Cover every section present -- contact info, summary, skills, work experience, education, certifications, and projects. Use null (for scalar fields) or an empty array (for list fields) for anything genuinely absent -- never invent information that isn't present in the text.

Guidance:
- workExperience: one entry per role, most recent first. Keep "description" to a brief 1-3 sentence summary of responsibilities/impact, not a verbatim bullet dump.
- education: one entry per degree/program.
- certifications: names only, e.g. "AWS Certified Solutions Architect".
- projects: personal/side projects mentioned outside of work experience, if any.
- links: URLs only (LinkedIn, GitHub, portfolio, etc.), not plain text.

--- RESUME ---
${resumeText.slice(0, 8000)}
`;

  try {
    const raw = await callGroqStructured(prompt, 'candidate_profile', CANDIDATE_PROFILE_JSON_SCHEMA, 3500);
    const parsed = CandidateProfileSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn('[extractCandidateProfile] Response failed validation:', parsed.error.issues);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.warn('[extractCandidateProfile] Failed, leaving profile fields untouched:', err);
    return null;
  }
}
