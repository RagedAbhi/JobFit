'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobDescriptionInput } from '@/components/JobDescriptionInput';
import { AnalyzeButton } from '@/components/AnalyzeButton';
import { ErrorBanner } from '@/components/ErrorBanner';
import { labelClass, inputClass } from '@/components/forms/FormPrimitives';
import type { ApiResponse, AnalyzeSuccessResponse } from '@/types/analysis';
import type { ResumeListEntry } from '@/app/api/resumes/route';

type Status = 'idle' | 'loading' | 'error' | 'rate-limited';

const MIN_JD_LENGTH = 30;

// /api/analyze is a single Groq call, not distinct phases -- these are timed
// reassurance copy for one ongoing request, not fabricated completed steps.
const LOADING_LABELS = [
  'Analyzing…',
  'Comparing skills and requirements…',
  'Still working — this can take up to 30s…',
];

export function AnalyzeFlow({ resumes }: { resumes: ResumeListEntry[] }) {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [resumeId, setResumeId] = useState(
    () => resumes.find((r) => r.isActive)?.id ?? resumes[0]?.id ?? ''
  );
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState(LOADING_LABELS[0]);

  const canAnalyze = jobDescription.trim().length >= MIN_JD_LENGTH && !!resumeId && status !== 'loading';

  useEffect(() => {
    if (status !== 'loading') return;
    const timers = [
      setTimeout(() => setLoadingLabel(LOADING_LABELS[1]), 5000),
      setTimeout(() => setLoadingLabel(LOADING_LABELS[2]), 15000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [status]);

  const runAnalysis = useCallback(async () => {
    setStatus('loading');
    setLoadingLabel(LOADING_LABELS[0]);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionText: jobDescription, resumeId }),
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
  }, [jobDescription, resumeId, router]);

  return (
    <div className="space-y-6">
      {resumes.length > 1 && (
        <div>
          <label htmlFor="resume-picker" className={labelClass}>
            Resume to match against
          </label>
          <select
            id="resume-picker"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            disabled={status === 'loading'}
            className={inputClass}
          >
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <JobDescriptionInput
        value={jobDescription}
        onChange={setJobDescription}
        disabled={status === 'loading'}
      />
      <AnalyzeButton
        disabled={!canAnalyze}
        loading={status === 'loading'}
        loadingLabel={loadingLabel}
        onClick={runAnalysis}
      />

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
