'use client';

import { useState } from 'react';
import { FileText, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ResumeUploadZone } from '@/components/ResumeUploadZone';
import type { ParsedPdf } from '@/lib/pdf-parser';
import type { ApiResponse } from '@/types/analysis';
import type { Profile } from '@/types/db';

interface SavedResume {
  fileName: string;
  pageCount: number;
  charCount: number;
  updatedAt: string;
  fullName: string | null;
}

function toSavedResume(profile: Profile | null): SavedResume | null {
  if (!profile?.resume_text || !profile.resume_filename) return null;
  return {
    fileName: profile.resume_filename,
    pageCount: profile.resume_page_count ?? 0,
    charCount: profile.resume_char_count ?? 0,
    updatedAt: profile.updated_at,
    fullName: profile.full_name,
  };
}

export function ResumeManager({ initialProfile }: { initialProfile: Profile | null }) {
  const [saved, setSaved] = useState<SavedResume | null>(toSavedResume(initialProfile));
  const [showUpload, setShowUpload] = useState(saved === null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParsed = async (result: ParsedPdf) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/profile/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: result.text,
          fileName: result.fileName,
          pageCount: result.pageCount,
          charCount: result.charCount,
        }),
      });
      const json = (await res.json()) as ApiResponse<{ saved: true; fullName: string | null }>;

      if (!json.success) {
        setError(json.error.message);
        return;
      }

      setSaved({
        fileName: result.fileName,
        pageCount: result.pageCount,
        charCount: result.charCount,
        updatedAt: new Date().toISOString(),
        fullName: json.data.fullName,
      });
      setShowUpload(false);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (saved && !showUpload) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'var(--color-success)' }} />
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">
                {saved.fullName ?? saved.fileName}
              </p>
              <p className="text-xs text-[var(--color-text-faint)]">
                {saved.fileName} · {saved.pageCount} page{saved.pageCount === 1 ? '' : 's'} ·{' '}
                {saved.charCount.toLocaleString()} characters · updated{' '}
                {new Date(saved.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Replace resume
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ResumeUploadZone onParsed={handleParsed} onClear={() => {}} disabled={saving} />
      {saving && (
        <p className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
          <FileText className="h-4 w-4 animate-pulse" />
          Saving resume…
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-danger)' }}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {saved && (
        <button
          onClick={() => setShowUpload(false)}
          className="text-sm font-medium text-[var(--color-text-faint)] hover:underline"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
