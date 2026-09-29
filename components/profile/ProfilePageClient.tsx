'use client';

import { useState } from 'react';
import { ResumeManager } from '@/components/profile/ResumeManager';
import { ProfileEditor, toEditableFields, fromCandidateProfile } from '@/components/profile/ProfileEditor';
import type { CandidateProfile } from '@/schemas/candidate-profile.schema';
import type { Profile } from '@/types/db';

export function ProfilePageClient({ initialProfile }: { initialProfile: Profile | null }) {
  const [fields, setFields] = useState(() => toEditableFields(initialProfile));
  // Bumped whenever a resume re-extraction updates `fields` out from under
  // the editor, forcing ProfileEditor to remount and pick up the new values
  // instead of holding onto whatever the user had been typing.
  const [editorKey, setEditorKey] = useState(0);

  const handleExtracted = (extracted: CandidateProfile) => {
    setFields(fromCandidateProfile(extracted));
    setEditorKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Resume</h2>
        <ResumeManager initialProfile={initialProfile} onExtracted={handleExtracted} />
      </div>

      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-1 text-sm font-semibold text-[var(--color-text)]">Profile</h2>
        <p className="mb-4 text-xs text-[var(--color-text-faint)]">
          Auto-filled from your resume — edit anytime. Replacing your resume re-extracts these fields.
        </p>
        <ProfileEditor key={editorKey} initialFields={fields} />
      </div>
    </div>
  );
}
