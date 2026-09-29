import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';

function jsonError(code: ApiErrorCode, message: string, status: number) {
  const body: ApiResponse<never> = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to delete an analysis.', 401);
  }

  const rateLimit = checkRateLimit(`job-delete:${user.id}`, 20, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(
      'RATE_LIMITED',
      `Too many deletions. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      429
    );
  }

  const { error } = await supabase.from('job_analyses').delete().eq('id', jobId).eq('user_id', user.id);

  if (error) {
    console.error('[jobs] Failed to delete analysis:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return jsonError('UPSTREAM_ERROR', 'Failed to delete this analysis. Please try again.', 502);
  }

  const responseBody: ApiResponse<{ deleted: true }> = { success: true, data: { deleted: true } };
  return NextResponse.json(responseBody, { status: 200 });
}
