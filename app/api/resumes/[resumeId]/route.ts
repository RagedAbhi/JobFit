import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractCandidateProfile } from '@/lib/groq-client';
import { checkRateLimit } from '@/lib/rate-limit';
import { UpdateResumeRequestSchema } from '@/schemas/resume.schema';
import type { CandidateProfile } from '@/schemas/candidate-profile.schema';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';
import type { Profile, Resume } from '@/types/db';

export const maxDuration = 60;
export const runtime = 'nodejs';

const UNIQUE_VIOLATION = '23505';

function jsonError(code: ApiErrorCode, message: string, status: number) {
  const body: ApiResponse<never> = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

/** Every route.ts export gets the same resumeId param shape in Next 16. */
type RouteParams = { params: Promise<{ resumeId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { resumeId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to edit a resume.', 401);
  }

  const rateLimit = checkRateLimit(`resumes-edit:${user.id}`, 20, 5 * 60 * 1000);
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

  const parsed = UpdateResumeRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return jsonError('INVALID_REQUEST', parsed.error.issues.map((i) => i.message).join('; '), 400);
  }

  // Ownership check, doubling up on RLS (supabase/AGENTS.md: never rely on
  // app-level checks alone -- this is the app-level check on top of RLS, not
  // instead of it). A request for another account's resume reads as a plain
  // not-found.
  const [{ data: existing }, { data: profileData }] = await Promise.all([
    supabase.from('resumes').select('id').eq('id', resumeId).eq('user_id', user.id).single(),
    supabase.from('profiles').select('active_resume_id').eq('id', user.id).single(),
  ]);
  if (!existing) {
    return jsonError('INVALID_REQUEST', 'Resume not found.', 404);
  }

  const { name, resumeText, fileName, pageCount, charCount } = parsed.data;
  const activeResumeId = (profileData as Pick<Profile, 'active_resume_id'> | null)?.active_resume_id ?? null;
  const isActiveResume = activeResumeId === resumeId;

  // Extraction only re-runs when the FILE of the currently active resume
  // changes -- active is "the one driving the rest of the app" (generate
  // resume, the shared profile fields), so keeping those fields in sync with
  // it stays meaningful as the user switches which resume is active. See
  // docs/specs/0001-multiple-resumes-add-switch/index.md, AC-6.
  let extractedProfile: CandidateProfile | null = null;
  if (resumeText !== undefined && isActiveResume) {
    extractedProfile = await extractCandidateProfile(resumeText);
  }

  const { error } = await supabase
    .from('resumes')
    .update({
      ...(name !== undefined && { name }),
      ...(resumeText !== undefined && {
        resume_text: resumeText,
        resume_filename: fileName,
        resume_page_count: pageCount,
        resume_char_count: charCount,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', resumeId)
    .eq('user_id', user.id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return jsonError('INVALID_REQUEST', `You already have a resume named "${name}".`, 400);
    }
    console.error('[resumes/id] Failed to update resume:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return jsonError('UPSTREAM_ERROR', 'Failed to save your changes. Please try again.', 502);
  }

  if (extractedProfile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      // Best-effort, same as the original single-resume save path -- the
      // resume file itself already saved successfully above.
      console.error(
        '[resumes/id] Failed to save re-extracted profile fields:',
        JSON.stringify(profileError, Object.getOwnPropertyNames(profileError))
      );
    }
  }

  const responseBody: ApiResponse<{ saved: true; profile: CandidateProfile | null }> = {
    success: true,
    data: { saved: true, profile: extractedProfile },
  };
  return NextResponse.json(responseBody, { status: 200 });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { resumeId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to delete a resume.', 401);
  }

  const rateLimit = checkRateLimit(`resumes-delete:${user.id}`, 10, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(
      'RATE_LIMITED',
      `Too many resume deletions. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      429
    );
  }

  const [{ data: existing }, { count: totalCount }, { count: analysesCount }, { data: profileData }] =
    await Promise.all([
      supabase.from('resumes').select('id').eq('id', resumeId).eq('user_id', user.id).single(),
      supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase
        .from('job_analyses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('resume_id', resumeId),
      supabase.from('profiles').select('active_resume_id').eq('id', user.id).single(),
    ]);

  if (!existing) {
    return jsonError('INVALID_REQUEST', 'Resume not found.', 404);
  }
  if ((totalCount ?? 0) <= 1) {
    return jsonError('INVALID_REQUEST', "You can't delete your only remaining resume.", 409);
  }
  if ((analysesCount ?? 0) > 0) {
    return jsonError(
      'INVALID_REQUEST',
      'This resume has past analyses on file. Delete those first, or keep this resume.',
      409
    );
  }

  const activeResumeId = (profileData as Pick<Profile, 'active_resume_id'> | null)?.active_resume_id ?? null;
  const wasActive = activeResumeId === resumeId;

  let replacement: Resume | null = null;
  if (wasActive) {
    const { data: candidate } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .neq('id', resumeId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    replacement = candidate as Resume | null;
  }

  const { error } = await supabase.from('resumes').delete().eq('id', resumeId).eq('user_id', user.id);
  if (error) {
    console.error('[resumes/id] Failed to delete resume:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return jsonError('UPSTREAM_ERROR', 'Failed to delete this resume. Please try again.', 502);
  }

  if (wasActive && replacement) {
    const { error: activateError } = await supabase
      .from('profiles')
      .update({ active_resume_id: replacement.id, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (activateError) {
      console.error(
        '[resumes/id] Failed to reassign the active resume:',
        JSON.stringify(activateError, Object.getOwnPropertyNames(activateError))
      );
    }
  }

  const responseBody: ApiResponse<{ deleted: true; newActiveResumeId: string | null }> = {
    success: true,
    data: { deleted: true, newActiveResumeId: wasActive ? (replacement?.id ?? null) : null },
  };
  return NextResponse.json(responseBody, { status: 200 });
}
