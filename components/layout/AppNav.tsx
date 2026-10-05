import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ResumeSwitcher } from '@/components/layout/ResumeSwitcher';
import { CommandPalette } from '@/components/command/CommandPalette';

export function AppNav({ displayName }: { displayName?: string | null }) {
  return (
    <nav className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-[0.9rem] font-semibold tracking-tight text-[var(--color-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
          Jobfit
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <Link
            href="/analyze"
            className="font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            New Analysis
          </Link>
          <Link
            href="/generate-resume"
            className="hidden font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline"
          >
            Generate Resume
          </Link>
          <Link
            href="/profile"
            className="font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Profile
          </Link>
          {displayName && (
            <span className="hidden text-[var(--color-text-faint)] sm:inline">{displayName}</span>
          )}
          <ResumeSwitcher />
          <CommandPalette />
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-1.5 font-medium text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-danger)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
