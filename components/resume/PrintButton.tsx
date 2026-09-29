'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-canvas)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <Printer className="h-4 w-4" />
      Print / Save as PDF
    </button>
  );
}
