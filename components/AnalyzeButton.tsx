'use client';

import { Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

interface AnalyzeButtonProps {
  disabled: boolean;
  loading: boolean;
  loadingLabel?: string;
  onClick: () => void;
}

export function AnalyzeButton({ disabled, loading, loadingLabel, onClick }: AnalyzeButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-[var(--color-canvas)] transition-transform',
        'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)]',
        'shadow-[0_4px_20px_-4px_color-mix(in_oklch,var(--color-accent)_50%,transparent)]',
        'enabled:hover:scale-[1.02] enabled:active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:bg-none disabled:bg-[var(--color-border)] disabled:text-[var(--color-text-faint)] disabled:shadow-none'
      )}
    >
      {loading ? (
        <>
          <Spinner className="h-4 w-4" />
          {loadingLabel ?? 'Analyzing…'}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Analyze Match
        </>
      )}
    </button>
  );
}
