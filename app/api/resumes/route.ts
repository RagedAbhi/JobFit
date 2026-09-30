import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { CreateResumeRequestSchema } from '@/schemas/resume.schema';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';
import type { Profile, Resume } from '@/types/db';

// A free-tier portfolio app on Groq's and Supabase's free tiers -- a small
// cap keeps storage and (later) AI extraction cost predictable. See
// docs/specs/0001-multiple-resumes-add-switch/index.md, AC-1.
const MAX_RESUMES_PER_ACCOUNT = 5;

// Postgres unique_violation, raised by the (user_id, lower(name)) index.
const UNIQUE_VIOLATION = '23505';

function jsonError(code: ApiErrorCode, message: string, status: number) {
  const body: ApiResponse<never> = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export interface ResumeListEntry {
  id: string;
  name: string;
  fileName: string;
  pageCount: number;
  charCount: number;
  updatedAt: string;
  isActive: boolean;
}

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to view your resumes.', 401);
  }

  const [{ data: resumesData, error }, { data: profileData }] = await Promise.all([
    supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase.from('profiles').select('active_resume_id').eq('id', user.id).single(),
  ]);

  if (error) {
    console.error('[resumes] Failed to list resumes:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return jsonError('UPSTREAM_ERROR', 'Failed to load your resumes. Please try again.', 502);
  }

  const resumes = (resumesData as Resume[] | null) ?? [];
  const activeResumeId = (profileData as Pick<Profile, 'active_resume_id'> | null)?.active_resume_id ?? null;

  const responseBody: ApiResponse<ResumeListEntry[]> = {
    success: true,
    data: resumes.map((r) => ({
      id: r.id,
      name: r.name,
      fileName: r.resume_filename,
      pageCount: r.resume_page_count,
      charCount: r.resume_char_count,
      updatedAt: r.updated_at,
      isActive: r.id === activeResumeId,
    })),
  };
  return NextResponse.json(responseBody, { status: 200 });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to add a resume.', 401);
  }

  const rateLimit = checkRateLimit(`resumes-add:${user.id}`, 10, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(
      'RATE_LIMITED',
      `Too many resumes added. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      429
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return jsonError('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const parsed = CreateResumeRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return jsonError('INVALID_REQUEST', parsed.error.issues.map((i) => i.message).join('; '), 400);
  }

  const { count, error: countError } = await supabase
    .from('resumes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
    console.error('[resumes] Failed to count resumes:', JSON.stringify(countError, Object.getOwnPropertyNames(countError)));
    return jsonError('UPSTREAM_ERROR', 'Failed to add your resume. Please try again.', 502);
  }
  if ((count ?? 0) >= MAX_RESUMES_PER_ACCOUNT) {
    return jsonError(
      'INVALID_REQUEST',
      `You've reached the limit of ${MAX_RESUMES_PER_ACCOUNT} resumes. Delete one before adding another.`,
      409
    );
  }

  const { name, resumeText, fileName, pageCount, charCount } = parsed.data;

  const { data: inserted, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      name,
      resume_text: resumeText,
      resume_filename: fileName,
      resume_page_count: pageCount,
      resume_char_count: charCount,
    })
    .select('id, name')
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return jsonError('INVALID_REQUEST', `You already have a resume named "${name}".`, 400);
    }
    console.error('[resumes] Failed to add resume:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return jsonError('UPSTREAM_ERROR', 'Failed to add your resume. Please try again.', 502);
  }

  const responseBody: ApiResponse<{ saved: true; resume: { id: string; name: string } }> = {
    success: true,
    data: { saved: true, resume: inserted as { id: string; name: string } },
  };
  return NextResponse.json(responseBody, { status: 200 });
}
