import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractCandidateProfile } from '@/lib/groq-client';
import { checkRateLimit } from '@/lib/rate-limit';
import { SaveResumeRequestSchema } from '@/schemas/profile.schema';
import type { CandidateProfile } from '@/schemas/candidate-profile.schema';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';

// extractCandidateProfile can try several Groq models internally, each
// bounded at 10s (see lib/groq-client.ts) -- give this route the same
// headroom as /api/analyze.
export const maxDuration = 60;
export const runtime = 'nodejs';

function jsonError(code: ApiErrorCode, message: string, status: number) {
  const body: ApiResponse<never> = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to save a resume.', 401);
  }

  const rateLimit = checkRateLimit(`resume:${user.id}`, 10, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(
      'RATE_LIMITED',
      `Too many resume updates. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      429
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return jsonError('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const parsed = SaveResumeRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return jsonError('INVALID_REQUEST', parsed.error.issues.map((i) => i.message).join('; '), 400);
  }

  const { resumeText, fileName, pageCount, charCount } = parsed.data;

  // Best-effort -- never blocks the save. On total failure (Groq
  // unreachable) this is null, and we leave the existing profile fields
  // (name/headline/skills/etc.) untouched rather than clobbering them with
  // empty values; a real extraction result (even with individually null
  // fields, meaning "not found in this resume") does get written.
  const profile = await extractCandidateProfile(resumeText);

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(profile && {
        full_name: profile.name,
        headline: profile.headline,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        links: profile.links,
        skills: profile.skills,
        years_experience: profile.yearsExperience,
        summary: profile.summary,
        work_experience: profile.workExperience,
        education: profile.education,
        certifications: profile.certifications,
        projects: profile.projects,
      }),
      resume_text: resumeText,
      resume_filename: fileName,
      resume_page_count: pageCount,
      resume_char_count: charCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    // PostgrestError's fields can end up non-enumerable depending on how
    // it's constructed, which makes a plain `console.error(error)` (or even
    // `console.error({ message: error.message, ... })`) log as "{}" in some
    // environments. Object.getOwnPropertyNames() sidesteps that.
    console.error(
      '[profile/resume] Failed to save resume:',
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
    return jsonError('UPSTREAM_ERROR', 'Failed to save your resume. Please try again.', 502);
  }

  const responseBody: ApiResponse<{ saved: true; profile: CandidateProfile | null }> = {
    success: true,
    data: { saved: true, profile },
  };
  return NextResponse.json(responseBody, { status: 200 });
}
