import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractCandidateName } from '@/lib/groq-client';
import { SaveResumeRequestSchema } from '@/schemas/profile.schema';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';

// extractCandidateName can try several Groq models internally, each bounded
// at 10s (see lib/groq-client.ts) -- give this route the same headroom as
// /api/analyze.
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

  // Best-effort -- never blocks the save; falls back to null (and the UI
  // falls back to the account email) if extraction fails.
  const fullName = await extractCandidateName(resumeText);

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      resume_text: resumeText,
      resume_filename: fileName,
      resume_page_count: pageCount,
      resume_char_count: charCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[profile/resume] Failed to save resume:', error);
    return jsonError('UPSTREAM_ERROR', 'Failed to save your resume. Please try again.', 502);
  }

  const responseBody: ApiResponse<{ saved: true; fullName: string | null }> = {
    success: true,
    data: { saved: true, fullName },
  };
  return NextResponse.json(responseBody, { status: 200 });
}
