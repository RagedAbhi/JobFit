import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { UpdateProfileRequestSchema } from '@/schemas/candidate-profile.schema';
import type { ApiErrorCode, ApiResponse } from '@/types/analysis';

function jsonError(code: ApiErrorCode, message: string, status: number) {
  const body: ApiResponse<never> = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return jsonError('INVALID_REQUEST', 'You must be signed in to update your profile.', 401);
  }

  const rateLimit = checkRateLimit(`profile-edit:${user.id}`, 20, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(
      'RATE_LIMITED',
      `Too many profile updates. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      429
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return jsonError('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const parsed = UpdateProfileRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return jsonError('INVALID_REQUEST', parsed.error.issues.map((i) => i.message).join('; '), 400);
  }

  const {
    fullName,
    headline,
    email,
    phone,
    location,
    links,
    skills,
    yearsExperience,
    summary,
    workExperience,
    education,
    certifications,
    projects,
  } = parsed.data;

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName || null,
      headline: headline || null,
      email: email || null,
      phone: phone || null,
      location: location || null,
      links,
      skills,
      years_experience: yearsExperience,
      summary: summary || null,
      work_experience: workExperience,
      education,
      certifications,
      projects,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[profile] Failed to update profile:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return jsonError('UPSTREAM_ERROR', 'Failed to save your profile. Please try again.', 502);
  }

  const responseBody: ApiResponse<{ saved: true }> = { success: true, data: { saved: true } };
  return NextResponse.json(responseBody, { status: 200 });
}
