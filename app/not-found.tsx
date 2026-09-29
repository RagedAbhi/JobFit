import Link from 'next/link';
import { FileSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)]">
        <FileSearch className="h-5 w-5 text-[var(--color-text-faint)]" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-canvas)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
