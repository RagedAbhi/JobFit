import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractCandidateProfile } from '@/lib/groq-client';
import { checkRateLimit } from '@/lib/rate-limit';
import type { CandidateProfile } from '@/schemas/candidate-profile.schema';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';
import type { Profile, Resume } from '@/types/db';

export const maxDuration = 60;
export const runtime = 'nodejs';

function jsonError(code: ApiErrorCode, message: string, status: number) {
  const body: ApiResponse<never> = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to switch resumes.', 401);
  }

  const rateLimit = checkRateLimit(`resumes-activate:${user.id}`, 30, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(
      'RATE_LIMITED',
      `Too many switches. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      429
    );
  }

  const [{ data: existing }, { data: profileData }] = await Promise.all([
    supabase.from('resumes').select('id, resume_text').eq('id', resumeId).eq('user_id', user.id).single(),
    supabase.from('profiles').select('active_resume_id').eq('id', user.id).single(),
  ]);
  if (!existing) {
    return jsonError('INVALID_REQUEST', 'Resume not found.', 404);
  }

  const resume = existing as Pick<Resume, 'id' | 'resume_text'>;
  const activeResumeId = (profileData as Pick<Profile, 'active_resume_id'> | null)?.active_resume_id ?? null;

  // Already active: nothing to switch, and no need to burn a Groq call.
  if (activeResumeId === resumeId) {
    const responseBody: ApiResponse<{ activated: true; profile: null }> = {
      success: true,
      data: { activated: true, profile: null },
    };
    return NextResponse.json(responseBody, { status: 200 });
  }

  // Keep the shared profile fields (name, skills, experience, etc.) in sync
  // with whichever resume is now active -- same re-extraction the PATCH
  // route runs on a file replace of the active resume (see
  // docs/specs/0001-multiple-resumes-add-switch/index.md, AC-6). Best-effort:
  // extractCandidateProfile never throws, returns null on failure, in which
  // case we still switch the active resume but leave profile fields as-is.
  const extractedProfile: CandidateProfile | null = await extractCandidateProfile(resume.resume_text);

  const { error } = await supabase
    .from('profiles')
    .update({
      active_resume_id: resumeId,
      updated_at: new Date().toISOString(),
      ...(extractedProfile && {
        full_name: extractedProfile.name,
        headline: extractedProfile.headline,
        email: extractedProfile.email,
        phone: extractedProfile.phone,
        location: extractedProfile.location,
        links: extractedProfile.links,
        skills: extractedProfile.skills,
        years_experience: extractedProfile.yearsExperience,
        summary: extractedProfile.summary,
        work_experience: extractedProfile.workExperience,
        education: extractedProfile.education,
        certifications: extractedProfile.certifications,
        projects: extractedProfile.projects,
      }),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[resumes/activate] Failed to switch resume:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return jsonError('UPSTREAM_ERROR', 'Failed to switch resumes. Please try again.', 502);
  }

  const responseBody: ApiResponse<{ activated: true; profile: CandidateProfile | null }> = {
    success: true,
    data: { activated: true, profile: extractedProfile },
  };
  return NextResponse.json(responseBody, { status: 200 });
}
