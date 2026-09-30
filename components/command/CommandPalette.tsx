'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { LayoutDashboard, Sparkles, FileText, User, LogOut, Briefcase } from 'lucide-react';
import { getScoreColor } from '@/lib/utils';
import type { ApiResponse } from '@/types/analysis';
import type { JobListEntry } from '@/app/api/jobs/route';

const groupHeadingClass = 'px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]';
const itemClass =
  'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--color-text-muted)] data-[selected=true]:bg-[var(--color-surface-raised)] data-[selected=true]:text-[var(--color-text)]';

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<JobListEntry[] | null>(null);
  const signOutFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!open || jobs !== null) return;
    let cancelled = false;
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((json: ApiResponse<JobListEntry[]>) => {
        if (!cancelled && json.success) setJobs(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, jobs]);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  const handleSignOut = useCallback(() => {
    setOpen(false);
    signOutFormRef.current?.requestSubmit();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-text-faint)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
        aria-label="Open command palette"
      >
        <span className="hidden sm:inline">Search</span>
        <kbd className="font-sans">⌘K</kbd>
      </button>

      <form ref={signOutFormRef} action="/auth/signout" method="post" className="hidden" />

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        label="Command palette"
        overlayClassName="fixed inset-0 z-50 bg-black/60"
        contentClassName="fixed left-1/2 top-24 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
      >
        <CommandInput
          placeholder="Type a command or search…"
          className="w-full border-b border-[var(--color-border-subtle)] bg-transparent px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none"
        />
        <CommandList className="max-h-80 overflow-y-auto p-2">
          <CommandEmpty className="py-6 text-center text-sm text-[var(--color-text-faint)]">
            No results found.
          </CommandEmpty>

          <CommandGroup heading={<span className={groupHeadingClass}>Navigate</span>}>
            <CommandItem className={itemClass} onSelect={() => go('/dashboard')}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Dashboard
            </CommandItem>
            <CommandItem className={itemClass} onSelect={() => go('/analyze')}>
              <Sparkles className="h-4 w-4 shrink-0" />
              New Analysis
            </CommandItem>
            <CommandItem className={itemClass} onSelect={() => go('/generate-resume')}>
              <FileText className="h-4 w-4 shrink-0" />
              Generate Resume
            </CommandItem>
            <CommandItem className={itemClass} onSelect={() => go('/profile')}>
              <User className="h-4 w-4 shrink-0" />
              Profile
            </CommandItem>
            <CommandItem className={itemClass} onSelect={handleSignOut}>
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </CommandItem>
          </CommandGroup>

          {jobs && jobs.length > 0 && (
            <CommandGroup heading={<span className={groupHeadingClass}>Your analyses</span>}>
              {jobs.map((job) => (
                <CommandItem
                  key={job.id}
                  value={`${job.jobTitle} ${job.matchScore}`}
                  className={itemClass}
                  onSelect={() => go(`/dashboard/${job.id}`)}
                >
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{job.jobTitle}</span>
                  <span className="shrink-0 text-xs font-semibold" style={{ color: getScoreColor(job.matchScore) }}>
                    {job.matchScore}%
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="flex items-center gap-3 border-t border-[var(--color-border-subtle)] px-4 py-2 text-xs text-[var(--color-text-faint)]">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </CommandDialog>
    </>
  );
}
