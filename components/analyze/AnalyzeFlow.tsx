'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobDescriptionInput } from '@/components/JobDescriptionInput';
import { AnalyzeButton } from '@/components/AnalyzeButton';
import { ErrorBanner } from '@/components/ErrorBanner';
import type { ApiResponse, AnalyzeSuccessResponse } from '@/types/analysis';

type Status = 'idle' | 'loading' | 'error' | 'rate-limited';

const MIN_JD_LENGTH = 30;

export function AnalyzeFlow() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canAnalyze = jobDescription.trim().length >= MIN_JD_LENGTH && status !== 'loading';

  const runAnalysis = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionText: jobDescription }),
      });

      const json = (await res.json()) as ApiResponse<AnalyzeSuccessResponse>;

      if (!json.success) {
        setErrorMessage(json.error.message);
        setStatus(json.error.code === 'RATE_LIMITED' ? 'rate-limited' : 'error');
        return;
      }

      router.push(`/dashboard/${json.data.jobId}`);
    } catch {
      setErrorMessage('Network error — please check your connection and try again.');
      setStatus('error');
    }
  }, [jobDescription, router]);

  return (
    <div className="space-y-6">
      <JobDescriptionInput
        value={jobDescription}
        onChange={setJobDescription}
        disabled={status === 'loading'}
      />
      <AnalyzeButton disabled={!canAnalyze} loading={status === 'loading'} onClick={runAnalysis} />

      {(status === 'error' || status === 'rate-limited') && errorMessage && (
        <ErrorBanner
          message={errorMessage}
          isRateLimited={status === 'rate-limited'}
          onRetry={runAnalysis}
          onDismiss={() => setStatus('idle')}
        />
      )}
    </div>
  );
}
