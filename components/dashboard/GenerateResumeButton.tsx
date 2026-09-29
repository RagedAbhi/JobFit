'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Sparkles, AlertTriangle } from 'lucide-react';
import type { ApiResponse } from '@/types/analysis';
import type { TailoredResume } from '@/schemas/tailored-resume.schema';

export function GenerateResumeButton({ jobId, hasExisting }: { jobId: string; hasExisting: boolean }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasExisting) {
    return (
      <Link
        href={`/dashboard/${jobId}/resume`}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        <FileText className="h-4 w-4" />
        View Tailored Resume
      </Link>
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}/tailored-resume`, { method: 'POST' });
      const json = (await res.json()) as ApiResponse<TailoredResume>;

      if (!json.success) {
        setError(json.error.message);
        return;
      }

      router.push(`/dashboard/${jobId}/resume`);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-canvas)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {generating ? 'Generating…' : 'Generate Tailored Resume'}
      </button>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-danger)' }}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
