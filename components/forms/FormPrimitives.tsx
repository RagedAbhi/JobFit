'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

// Shared building blocks for the editable-form components (ProfileEditor,
// TailoredResumeEditor) -- both need chip-style list editors and
// add/remove-entry buttons for their repeating sections (skills, work
// experience, education, etc.), so this is factored out rather than
// duplicated a third time.

export const inputClass =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none';
export const labelClass = 'mb-1 block text-sm font-medium text-[var(--color-text)]';
export const sectionHeadingClass = 'mb-3 text-sm font-semibold text-[var(--color-text)]';

export function ChipListEditor({
  label,
  values,
  onChange,
  placeholder,
  max = 25,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  max?: number;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value || values.includes(value) || values.length >= max) {
      setDraft('');
      return;
    }
    onChange([...values, value]);
    setDraft('');
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] px-3 py-1 text-xs font-medium text-[var(--color-text)]"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                aria-label={`Remove ${value}`}
                className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

export function BulletListEditor({
  label,
  values,
  onChange,
  max = 8,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
}) {
  const update = (i: number, value: string) => onChange(values.map((v, idx) => (idx === i ? value : v)));
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const add = () => {
    if (values.length >= max) return;
    onChange([...values, '']);
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="space-y-2">
        {values.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={value}
              onChange={(e) => update(i, e.target.value)}
              className={inputClass}
            />
            <RemoveEntryButton onClick={() => remove(i)} />
          </div>
        ))}
      </div>
      {values.length < max && (
        <div className="mt-2">
          <AddEntryButton onClick={add} label="Add bullet" />
        </div>
      )}
    </div>
  );
}

export function RemoveEntryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove entry"
      className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)]"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function AddEntryButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
