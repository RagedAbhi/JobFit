'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <div
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'color-mix(in oklch, var(--color-danger) 18%, var(--color-surface))',
            color: 'var(--color-danger)',
          }}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-semibold text-[var(--color-text)]">Something went wrong</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          An unexpected error occurred. You can try again, or come back in a moment.
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    </div>
  );
}
