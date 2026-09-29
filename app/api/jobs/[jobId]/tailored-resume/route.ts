import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  buildTailoredResumePrompt,
  callGroqForTailoredResume,
  GroqInvalidOutputError,
  GroqRateLimitError,
  GroqTransientError,
} from '@/lib/groq-client';
import { TailoredResumeSchema, UpdateTailoredResumeRequestSchema } from '@/schemas/tailored-resume.schema';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';
import type { TailoredResume } from '@/schemas/tailored-resume.schema';
import type { JobAnalysisRow, Profile } from '@/types/db';

// callGroqForTailoredResume can try several models internally, each bounded
// at 10s (see lib/groq-client.ts) -- same headroom as /api/analyze.
export const maxDuration = 60;
export const runtime = 'nodejs';

function jsonError(code: ApiErrorCode, message: string, status: number) {
  const body: ApiResponse<never> = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to generate a tailored resume.', 401);
  }

  const rateLimit = checkRateLimit(`tailored-resume:${user.id}`, 5, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(
      'RATE_LIMITED',
      `You've hit the generation limit. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      429
    );
  }

  const [{ data: jobData }, { data: profileData }] = await Promise.all([
    supabase.from('job_analyses').select('*').eq('id', jobId).single(),
    supabase.from('profiles').select('*').single(),
  ]);
  const job = jobData as JobAnalysisRow | null;
  const profile = profileData as Profile | null;

  if (!job) {
    return jsonError('INVALID_REQUEST', 'Job analysis not found.', 404);
  }

  const hasProfileContent =
    profile && (profile.summary || profile.skills.length > 0 || profile.work_experience.length > 0);
  if (!hasProfileContent) {
    return jsonError(
      'INVALID_REQUEST',
      'Your profile needs some content first -- upload or replace your resume on /profile so we have something to tailor.',
      400
    );
  }

  const prompt = buildTailoredResumePrompt(
    {
      fullName: profile.full_name,
      headline: profile.headline,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      links: profile.links,
      summary: profile.summary,
      skills: profile.skills,
      workExperience: profile.work_experience,
      education: profile.education,
      certifications: profile.certifications,
    },
    job.job_description_text
  );

  // One retry on malformed output only -- same reasoning as /api/analyze:
  // rate limits/overload aren't worth retrying immediately, and Groq's
  // model fallback chain already tries multiple models internally.
  const MAX_ATTEMPTS = 2;
  let tailoredResume: TailoredResume | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let raw: unknown;
    try {
      raw = await callGroqForTailoredResume(prompt);
    } catch (err) {
      if (err instanceof GroqRateLimitError) {
        return jsonError(
          'RATE_LIMITED',
          'The AI service is rate-limited right now. Please wait a moment and try again.',
          429
        );
      }
      if (err instanceof GroqTransientError) {
        console.warn('[tailored-resume] Groq transiently unavailable:', err.message);
        return jsonError(
          'UPSTREAM_ERROR',
          'The AI service is temporarily overloaded. Please try again shortly.',
          502
        );
      }
      if (err instanceof GroqInvalidOutputError) {
        console.warn(`[tailored-resume] Groq returned invalid JSON (attempt ${attempt + 1}):`, err.message);
        continue;
      }
      console.error('[tailored-resume] Groq call failed:', err instanceof Error ? err.message : String(err));
      return jsonError('UPSTREAM_ERROR', 'Failed to reach the AI service. Please try again shortly.', 502);
    }

    const validated = TailoredResumeSchema.safeParse(raw);
    if (validated.success) {
      tailoredResume = validated.data;
      break;
    }
    console.warn(`[tailored-resume] Output failed schema validation (attempt ${attempt + 1}):`, validated.error.issues);
  }

  if (!tailoredResume) {
    return jsonError('AI_INVALID_OUTPUT', 'The AI returned data in an unexpected format. Please try again.', 502);
  }

  const { error: updateError } = await supabase
    .from('job_analyses')
    .update({ tailored_resume: tailoredResume })
    .eq('id', jobId);

  if (updateError) {
    console.error(
      '[tailored-resume] Failed to persist tailored resume:',
      JSON.stringify(updateError, Object.getOwnPropertyNames(updateError))
    );
    return jsonError('UPSTREAM_ERROR', 'Generated the resume but failed to save it. Please try again.', 502);
  }

  const responseBody: ApiResponse<TailoredResume> = { success: true, data: tailoredResume };
  return NextResponse.json(responseBody, { status: 200 });
}

/** Saves manual edits to an already-generated tailored resume -- no AI call. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to edit a tailored resume.', 401);
  }

  const rateLimit = checkRateLimit(`tailored-resume-edit:${user.id}`, 20, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(
      'RATE_LIMITED',
      `Too many edits. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      429
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return jsonError('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const parsed = UpdateTailoredResumeRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return jsonError('INVALID_REQUEST', parsed.error.issues.map((i) => i.message).join('; '), 400);
  }

  const { fullName, headline, email, phone, location, links, summary, skills, workExperience, education, certifications } =
    parsed.data;

  const tailoredResume: TailoredResume = {
    fullName,
    headline,
    email: email || null,
    phone: phone || null,
    location: location || null,
    links,
    summary,
    skills,
    workExperience: workExperience.map((entry) => ({
      company: entry.company,
      title: entry.title,
      startDate: entry.startDate || null,
      endDate: entry.endDate || null,
      bullets: entry.bullets,
    })),
    education: education.map((entry) => ({
      institution: entry.institution,
      degree: entry.degree || null,
      fieldOfStudy: entry.fieldOfStudy || null,
      startDate: entry.startDate || null,
      endDate: entry.endDate || null,
    })),
    certifications,
  };

  const { error } = await supabase
    .from('job_analyses')
    .update({ tailored_resume: tailoredResume })
    .eq('id', jobId);

  if (error) {
    console.error(
      '[tailored-resume] Failed to save edited resume:',
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
    return jsonError('UPSTREAM_ERROR', 'Failed to save your changes. Please try again.', 502);
  }

  const responseBody: ApiResponse<TailoredResume> = { success: true, data: tailoredResume };
  return NextResponse.json(responseBody, { status: 200 });
}
