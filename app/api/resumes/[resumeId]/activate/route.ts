import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';

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

  const { data: existing } = await supabase
    .from('resumes')
    .select('id')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single();
  if (!existing) {
    return jsonError('INVALID_REQUEST', 'Resume not found.', 404);
  }

  const { error } = await supabase
    .from('profiles')
    .update({ active_resume_id: resumeId, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[resumes/activate] Failed to switch resume:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return jsonError('UPSTREAM_ERROR', 'Failed to switch resumes. Please try again.', 502);
  }

  const responseBody: ApiResponse<{ activated: true }> = { success: true, data: { activated: true } };
  return NextResponse.json(responseBody, { status: 200 });
}
