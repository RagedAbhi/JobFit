'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobDescriptionInput } from '@/components/JobDescriptionInput';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiResponse, AnalyzeSuccessResponse } from '@/types/analysis';
import type { TailoredResume } from '@/schemas/tailored-resume.schema';

type Status = 'idle' | 'analyzing' | 'writing' | 'error' | 'rate-limited';

const MIN_JD_LENGTH = 30;

export function GenerateResumeFlow({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const busy = status === 'analyzing' || status === 'writing';
  const canGenerate = jobDescription.trim().length >= MIN_JD_LENGTH && !busy;

  const run = useCallback(async () => {
    setErrorMessage(null);

    try {
      setStatus('analyzing');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionText: jobDescription, resumeId }),
      });
      const analyzeJson = (await analyzeRes.json()) as ApiResponse<AnalyzeSuccessResponse>;

      if (!analyzeJson.success) {
        setErrorMessage(analyzeJson.error.message);
        setStatus(analyzeJson.error.code === 'RATE_LIMITED' ? 'rate-limited' : 'error');
        return;
      }

      const { jobId } = analyzeJson.data;

      setStatus('writing');
      const resumeRes = await fetch(`/api/jobs/${jobId}/tailored-resume`, { method: 'POST' });
      const resumeJson = (await resumeRes.json()) as ApiResponse<TailoredResume>;

      if (!resumeJson.success) {
        // The analysis itself was saved fine -- only the resume step
        // failed, so send them to the (already-created) job's detail page
        // rather than losing that work. They can retry generation from
        // there once the underlying issue (rate limit, overload) clears.
        setErrorMessage(`${resumeJson.error.message} Your analysis was saved -- you can retry from there.`);
        setStatus(resumeJson.error.code === 'RATE_LIMITED' ? 'rate-limited' : 'error');
        setTimeout(() => router.push(`/dashboard/${jobId}`), 2500);
        return;
      }

      router.push(`/dashboard/${jobId}/resume`);
    } catch {
      setErrorMessage('Network error — please check your connection and try again.');
      setStatus('error');
    }
  }, [jobDescription, resumeId, router]);

  return (
    <div className="space-y-6">
      <JobDescriptionInput value={jobDescription} onChange={setJobDescription} disabled={busy} />

      <button
        type="button"
        disabled={!canGenerate}
        onClick={run}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-6 py-2.5 text-sm font-semibold text-[var(--color-canvas)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[var(--color-border)] disabled:bg-none disabled:text-[var(--color-text-faint)]"
      >
        {status === 'analyzing' ? (
          <>
            <Spinner className="h-4 w-4" />
            Reading the job description…
          </>
        ) : status === 'writing' ? (
          <>
            <Spinner className="h-4 w-4" />
            Writing your tailored resume…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Resume
          </>
        )}
      </button>

      {(status === 'error' || status === 'rate-limited') && errorMessage && (
        <ErrorBanner
          message={errorMessage}
          isRateLimited={status === 'rate-limited'}
          onRetry={run}
          onDismiss={() => setStatus('idle')}
        />
      )}
    </div>
  );
}
