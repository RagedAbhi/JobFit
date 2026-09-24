'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, X, Clock } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  isRateLimited: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function ErrorBanner({ message, isRateLimited, onRetry, onDismiss }: ErrorBannerProps) {
  const toneColor = isRateLimited ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
        role="alert"
        className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: `color-mix(in oklch, ${toneColor} 18%, var(--color-surface))`,
              color: toneColor,
            }}
          >
            {isRateLimited ? <Clock className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {isRateLimited ? 'AI is busy right now' : 'Something went wrong'}
            </p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{message}</p>
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
