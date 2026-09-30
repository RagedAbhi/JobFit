'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Trash2 } from 'lucide-react';
import { cn, getScoreColor } from '@/lib/utils';
import type { JobAnalysisRow } from '@/types/db';
import type { ApiResponse } from '@/types/analysis';

function scoreLabel(score: number) {
  if (score >= 70) return 'Strong match';
  if (score >= 40) return 'Partial match';
  return 'Weak match';
}

function ScoreRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = getScoreColor(score);

  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg width={48} height={48} viewBox="0 0 44 44" className="-rotate-90">
        <circle cx={22} cy={22} r={radius} stroke="var(--color-border)" strokeWidth={3.5} fill="none" />
        <circle
          cx={22}
          cy={22}
          r={radius}
          stroke={color}
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

interface JobCardProps {
  job: JobAnalysisRow;
  style?: React.CSSProperties;
  className?: string;
  onDeleted?: (jobId: string) => void;
}

export function JobCard({ job, style, className, onDeleted }: JobCardProps) {
  const date = new Date(job.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const color = getScoreColor(job.match_score);

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const requestDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(true);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);

    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ deleted: true }>;

      if (json.success) {
        onDeleted?.(job.id);
        return;
      }
    } catch {
      // fall through to reset below
    }
    setDeleting(false);
    setConfirming(false);
  };

  return (
    <Link
      href={`/dashboard/${job.id}`}
      style={style}
      className={cn(
        'card-hover group flex h-full flex-col gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-[var(--color-text)]">{job.job_title}</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">{date}</p>
        </div>
        <ScoreRing score={job.match_score} />
      </div>

      <p className="line-clamp-3 flex-1 text-sm text-[var(--color-text-muted)]">{job.summary}</p>

      <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3">
        {confirming ? (
          <div className="flex w-full items-center justify-between gap-2 text-xs">
            <span className="text-[var(--color-text-faint)]">Delete this analysis?</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="font-medium text-[var(--color-text-faint)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="font-semibold text-[var(--color-danger)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="text-xs font-medium" style={{ color }}>
              {scoreLabel(job.match_score)}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={requestDelete}
                aria-label="Delete analysis"
                className="text-[var(--color-text-faint)] opacity-0 transition-opacity hover:text-[var(--color-danger)] group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <ChevronRight className="h-4 w-4 text-[var(--color-text-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
