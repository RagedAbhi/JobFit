import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequestSchema } from '@/schemas/request.schema';
import { AIAnalysisResponseSchema } from '@/schemas/ai-response.schema';
import {
  buildAnalysisPrompt,
  callGroqForAnalysis,
  GroqInvalidOutputError,
  GroqRateLimitError,
  GroqTransientError,
} from '@/lib/groq-client';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import type { ApiErrorCode, ApiResponse, AnalyzeSuccessResponse } from '@/types/analysis';
import type { Resume } from '@/types/db';

// Vercel Hobby: default fn timeout is 10s, configurable up to 60s (the
// ceiling on this plan). callGroqForAnalysis can try several models
// internally (see FALLBACK_MODELS in lib/groq-client.ts), each bounded at
// 10s -- worst case ~30s for one call, so this handler does NOT also retry
// the whole call on malformed output (that would risk 2x30s getting close
// to 60s); see MAX_ATTEMPTS below.
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
    return jsonError('INVALID_REQUEST', 'You must be signed in to run an analysis.', 401);
  }

  // Each analysis costs a real AI call -- cap how often one account can
  // trigger them so a runaway client (or bot) can't burn through the whole
  // app's free-tier Groq quota.
  const rateLimit = checkRateLimit(`analyze:${user.id}`, 5, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonError(
      'RATE_LIMITED',
      `You've hit the analysis limit. Please try again in ${rateLimit.retryAfterSeconds}s.`,
      429
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return jsonError('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const parsedRequest = AnalyzeRequestSchema.safeParse(bodyJson);
  if (!parsedRequest.success) {
    return jsonError(
      'INVALID_REQUEST',
      parsedRequest.error.issues.map((i) => i.message).join('; '),
      400
    );
  }

  const { jobDescriptionText, resumeId } = parsedRequest.data;

  // Ownership check, doubling up on RLS (supabase/AGENTS.md: never rely on
  // app-level checks alone). A resumeId for another account's resume reads
  // as a plain not-found rather than leaking whose it is.
  const { data: resumeData } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single();
  const resume = resumeData as Resume | null;

  if (!resume) {
    return jsonError('INVALID_REQUEST', 'That resume was not found. Pick a resume to analyze.', 400);
  }

  const prompt = buildAnalysisPrompt(resume.resume_text, jobDescriptionText);

  // callGroqForAnalysis already tries several models internally on overload
  // (see FALLBACK_MODELS), and a single pass through that list can already
  // take up to ~30s -- so this handler does not also retry the whole call,
  // to stay safely under maxDuration. Malformed JSON is rare with Groq's
  // strict schema mode; surfacing AI_INVALID_OUTPUT and letting the user
  // click Analyze again is an acceptable trade-off for a predictable time
  // budget.
  const MAX_ATTEMPTS = 1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let rawParsed: unknown;
    try {
      rawParsed = await callGroqForAnalysis(prompt);
    } catch (err) {
      if (err instanceof GroqRateLimitError) {
        return jsonError(
          'RATE_LIMITED',
          'The AI service is rate-limited right now. Please wait a moment and try again.',
          429
        );
      }
      if (err instanceof GroqTransientError) {
        console.warn('[analyze] Groq transiently unavailable:', err.message);
        return jsonError(
          'UPSTREAM_ERROR',
          'The AI service is temporarily overloaded. Please try again shortly.',
          502
        );
      }
      if (err instanceof GroqInvalidOutputError) {
        console.warn(`[analyze] Groq returned invalid JSON (attempt ${attempt + 1}):`, err.message);
        continue; // retry immediately -- a formatting fluke, not worth waiting for
      }
      console.error('[analyze] Groq call failed:', err);
      return jsonError(
        'UPSTREAM_ERROR',
        'Failed to reach the AI service. Please try again shortly.',
        502
      );
    }

    const validated = AIAnalysisResponseSchema.safeParse(rawParsed);
    if (validated.success) {
      const analysis = validated.data;

      const { data: inserted, error: insertError } = await supabase
        .from('job_analyses')
        .insert({
          user_id: user.id,
          job_title: analysis.jobTitle,
          job_description_text: jobDescriptionText,
          match_score: analysis.matchScore,
          summary: analysis.summary,
          matching_skills: analysis.matchingSkills,
          missing_skills: analysis.missingSkills,
          optional_missing_skills: analysis.optionalMissingSkills,
          improvement_suggestions: analysis.improvementSuggestions,
          resume_id: resume.id,
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        console.error(
          '[analyze] Failed to persist job analysis:',
          insertError ? JSON.stringify(insertError, Object.getOwnPropertyNames(insertError)) : 'no row returned'
        );
        return jsonError(
          'UPSTREAM_ERROR',
          'Analysis succeeded but saving it failed. Please try again.',
          502
        );
      }

      // Picking a resume here also switches it to the account's active one
      // (see docs/specs/0001-multiple-resumes-add-switch/index.md, AC-3) -- best
      // effort, never blocks returning the analysis that already saved.
      const { error: activateError } = await supabase
        .from('profiles')
        .update({ active_resume_id: resume.id, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (activateError) {
        console.error(
          '[analyze] Failed to set the active resume:',
          JSON.stringify(activateError, Object.getOwnPropertyNames(activateError))
        );
      }

      const responseBody: ApiResponse<AnalyzeSuccessResponse> = {
        success: true,
        data: { ...analysis, jobId: inserted.id as string },
      };
      return NextResponse.json(responseBody, { status: 200 });
    }

    console.warn(
      `[analyze] AI output failed schema validation (attempt ${attempt + 1}):`,
      validated.error.issues
    );
    // loop again for the retry
  }

  return jsonError(
    'AI_INVALID_OUTPUT',
    'The AI returned data in an unexpected format. Please try again.',
    502
  );
}
