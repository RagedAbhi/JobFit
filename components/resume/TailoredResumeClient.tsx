'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Pencil } from 'lucide-react';
import { PrintButton } from '@/components/resume/PrintButton';
import { TailoredResumeView } from '@/components/resume/TailoredResumeView';
import { TailoredResumeEditor } from '@/components/resume/TailoredResumeEditor';
import { formatTailoredResumeAsText } from '@/lib/format-tailored-resume';
import type { TailoredResume } from '@/schemas/tailored-resume.schema';

export function TailoredResumeClient({
  jobId,
  initialResume,
}: {
  jobId: string;
  initialResume: TailoredResume;
}) {
  const [resume, setResume] = useState(initialResume);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatTailoredResumeAsText(resume));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context) --
      // fail silently, the button just never flips to "Copied".
    }
  };

  return (
    <>
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/dashboard/${jobId}`}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to analysis
        </Link>
        {mode === 'view' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy as text'}
            </button>
            <PrintButton />
          </div>
        )}
      </div>

      {mode === 'view' ? (
        <TailoredResumeView resume={resume} />
      ) : (
        <TailoredResumeEditor
          jobId={jobId}
          initialResume={resume}
          onSaved={(updated) => {
            setResume(updated);
            setMode('view');
          }}
          onCancel={() => setMode('view')}
        />
      )}
    </>
  );
}
