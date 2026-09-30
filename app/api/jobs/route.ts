import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';

function jsonError(code: ApiErrorCode, message: string, status: number) {
  const body: ApiResponse<never> = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export interface JobListEntry {
  id: string;
  jobTitle: string;
  matchScore: number;
}

const MAX_JOBS = 20;

/** Backs the command palette's "go to job" entries -- no AI call, no rate limit needed. */
export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in.', 401);
  }

  const { data, error } = await supabase
    .from('job_analyses')
    .select('id, job_title, match_score')
    .order('created_at', { ascending: false })
    .limit(MAX_JOBS);

  if (error) {
    console.error('[jobs] Failed to list analyses:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return jsonError('UPSTREAM_ERROR', 'Failed to load your analyses.', 502);
  }

  const jobs: JobListEntry[] = (data ?? []).map((row) => ({
    id: row.id,
    jobTitle: row.job_title,
    matchScore: row.match_score,
  }));

  const responseBody: ApiResponse<JobListEntry[]> = { success: true, data: jobs };
  return NextResponse.json(responseBody, { status: 200 });
}
