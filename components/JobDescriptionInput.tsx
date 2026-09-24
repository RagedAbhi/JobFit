'use client';

import { SAMPLE_JDS } from '@/lib/sample-jds';
import { cn } from '@/lib/utils';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function JobDescriptionInput({ value, onChange, disabled }: JobDescriptionInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="jd-textarea" className="text-sm font-medium text-[var(--color-text)]">
          Job Description
        </label>
        <span className="text-xs text-[var(--color-text-faint)]">
          {value.length.toLocaleString()} chars
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SAMPLE_JDS.map((jd) => (
          <button
            key={jd.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(jd.text)}
            className={cn(
              'rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors',
              'hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {jd.label}
          </button>
        ))}
      </div>

      <textarea
        id="jd-textarea"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the job description here, or click a preset above..."
        rows={8}
        className={cn(
          'w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3 text-sm text-[var(--color-text)]',
          'placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60'
        )}
      />
    </div>
  );
}
