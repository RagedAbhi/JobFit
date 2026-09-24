import type { AIAnalysisResponse } from '@/schemas/ai-response.schema';

export type { AnalyzeRequest } from '@/schemas/request.schema';
export type { AIAnalysisResponse, ImprovementSuggestion } from '@/schemas/ai-response.schema';

// Returned by POST /api/analyze on success -- the AI analysis plus the id of
// the job_analyses row it was persisted as, so the client can navigate to
// its detail page.
export type AnalyzeSuccessResponse = AIAnalysisResponse & { jobId: string };

export type ApiErrorCode =
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'AI_INVALID_OUTPUT'
  | 'UPSTREAM_ERROR'
  | 'UNKNOWN';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ApiErrorCode; message: string } };
