'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import type { ApiResponse } from '@/types/analysis';
import type { ResumeListEntry } from '@/app/api/resumes/route';

// Lazily loaded on first open, same pattern as CommandPalette's job list --
// most page loads never open this, so there's no reason to fetch it eagerly
// on every nav render. Renders nothing until there is more than one resume
// to switch between (see docs/specs/0001-multiple-resumes-add-switch/index.md).
export function ResumeSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeListEntry[] | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/resumes')
      .then((res) => res.json())
      .then((json: ApiResponse<ResumeListEntry[]>) => {
        if (!cancelled && json.success) setResumes(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const switchTo = useCallback(
    async (id: string) => {
      if (switching) return;
      setSwitching(id);
      try {
        const res = await fetch(`/api/resumes/${id}/activate`, { method: 'POST' });
        const json = (await res.json()) as ApiResponse<{ activated: true }>;
        if (json.success) {
          setResumes((prev) => prev?.map((r) => ({ ...r, isActive: r.id === id })) ?? prev);
          setOpen(false);
          router.refresh();
        }
      } catch {
        // stays on the previous active resume, the menu stays open for a retry
      } finally {
        setSwitching(null);
      }
    },
    [router, switching]
  );

  if (!resumes || resumes.length <= 1) return null;

  const active = resumes.find((r) => r.isActive);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-medium text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)]"
        aria-label="Switch active resume"
        aria-expanded={open}
      >
        <span className="max-w-[8rem] truncate">{active?.name ?? 'Select resume'}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-lg">
          {resumes.map((resume) => (
            <button
              key={resume.id}
              type="button"
              onClick={() => switchTo(resume.id)}
              disabled={switching !== null}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)] disabled:cursor-not-allowed"
            >
              <Check className={`h-3.5 w-3.5 shrink-0 ${resume.isActive ? 'opacity-100' : 'opacity-0'}`} style={{ color: 'var(--color-accent)' }} />
              <span className="flex-1 truncate">{resume.name}</span>
              {switching === resume.id && <span className="text-xs text-[var(--color-text-faint)]">…</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
