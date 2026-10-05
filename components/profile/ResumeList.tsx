'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, RefreshCw, Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { ResumeUploadZone } from '@/components/ResumeUploadZone';
import { inputClass, labelClass } from '@/components/forms/FormPrimitives';
import type { ParsedPdf } from '@/lib/pdf-parser';
import type { ApiResponse } from '@/types/analysis';
import type { CandidateProfile } from '@/schemas/candidate-profile.schema';
import type { ResumeListEntry } from '@/app/api/resumes/route';

const MAX_RESUMES_PER_ACCOUNT = 5;

interface ResumeListProps {
  initialResumes: ResumeListEntry[];
  onExtracted?: (profile: CandidateProfile) => void;
}

export function ResumeList({ initialResumes, onExtracted }: ResumeListProps) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [showAdd, setShowAdd] = useState(resumes.length === 0);

  const atCap = resumes.length >= MAX_RESUMES_PER_ACCOUNT;

  const handleAdded = (entry: ResumeListEntry) => {
    setResumes((prev) => [entry, ...prev]);
    setShowAdd(false);
  };

  const handleActivated = (id: string) => {
    setResumes((prev) => prev.map((r) => ({ ...r, isActive: r.id === id })));
    router.refresh();
  };

  const handleRenamed = (id: string, name: string) => {
    setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  };

  const handleReplaced = (id: string, patch: Partial<ResumeListEntry>) => {
    setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    router.refresh();
  };

  const handleDeleted = (id: string, newActiveResumeId: string | null) => {
    setResumes((prev) =>
      prev
        .filter((r) => r.id !== id)
        .map((r) => (newActiveResumeId ? { ...r, isActive: r.id === newActiveResumeId } : r))
    );
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {resumes.length > 0 && (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <ResumeRow
              key={resume.id}
              resume={resume}
              onActivated={handleActivated}
              onRenamed={handleRenamed}
              onReplaced={handleReplaced}
              onDeleted={handleDeleted}
              onExtracted={onExtracted}
            />
          ))}
        </div>
      )}

      {showAdd ? (
        <AddResumeForm onAdded={handleAdded} onCancel={resumes.length > 0 ? () => setShowAdd(false) : undefined} />
      ) : atCap ? (
        <p className="text-xs text-[var(--color-text-faint)]">
          You&apos;ve reached the limit of {MAX_RESUMES_PER_ACCOUNT} resumes. Delete one to add another.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Add another resume
        </button>
      )}
    </div>
  );
}

function AddResumeForm({
  onAdded,
  onCancel,
}: {
  onAdded: (entry: ResumeListEntry) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParsed = async (result: ParsedPdf) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Give this resume a name first.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          resumeText: result.text,
          fileName: result.fileName,
          pageCount: result.pageCount,
          charCount: result.charCount,
        }),
      });
      const json = (await res.json()) as ApiResponse<{ saved: true; resume: { id: string; name: string } }>;

      if (!json.success) {
        setError(json.error.message);
        return;
      }

      onAdded({
        id: json.data.resume.id,
        name: json.data.resume.name,
        fileName: result.fileName,
        pageCount: result.pageCount,
        charCount: result.charCount,
        updatedAt: new Date().toISOString(),
        isActive: false,
      });
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-border-subtle)] p-4">
      <div>
        <label htmlFor="new-resume-name" className={labelClass}>
          Name this resume
        </label>
        <input
          id="new-resume-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Frontend"
          className={inputClass}
          disabled={saving}
        />
      </div>
      <ResumeUploadZone onParsed={handleParsed} onClear={() => {}} disabled={saving || !name.trim()} />
      {!name.trim() && <p className="text-xs text-[var(--color-text-faint)]">Name it before uploading a PDF.</p>}
      {saving && <p className="text-sm text-[var(--color-text-muted)]">Saving resume…</p>}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-danger)' }}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-[var(--color-text-faint)] hover:underline"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function ResumeRow({
  resume,
  onActivated,
  onRenamed,
  onReplaced,
  onDeleted,
  onExtracted,
}: {
  resume: ResumeListEntry;
  onActivated: (id: string) => void;
  onRenamed: (id: string, name: string) => void;
  onReplaced: (id: string, patch: Partial<ResumeListEntry>) => void;
  onDeleted: (id: string, newActiveResumeId: string | null) => void;
  onExtracted?: (profile: CandidateProfile) => void;
}) {
  const [activating, setActivating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(resume.name);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const activate = async () => {
    setActivating(true);
    try {
      const res = await fetch(`/api/resumes/${resume.id}/activate`, { method: 'POST' });
      const json = (await res.json()) as ApiResponse<{ activated: true; profile: CandidateProfile | null }>;
      if (json.success) {
        onActivated(resume.id);
        if (json.data.profile) onExtracted?.(json.data.profile);
      }
    } catch {
      // Stays inactive on a network error; the button re-enables for a retry.
    } finally {
      setActivating(false);
    }
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === resume.name) {
      setEditingName(false);
      setNameDraft(resume.name);
      return;
    }
    setSavingName(true);
    setNameError(null);

    try {
      const res = await fetch(`/api/resumes/${resume.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = (await res.json()) as ApiResponse<{ saved: true; profile: CandidateProfile | null }>;

      if (!json.success) {
        setNameError(json.error.message);
        return;
      }
      onRenamed(resume.id, trimmed);
      setEditingName(false);
    } catch {
      setNameError('Network error — please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handleReplaceParsed = async (result: ParsedPdf) => {
    setSavingFile(true);
    setFileError(null);

    try {
      const res = await fetch(`/api/resumes/${resume.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: result.text,
          fileName: result.fileName,
          pageCount: result.pageCount,
          charCount: result.charCount,
        }),
      });
      const json = (await res.json()) as ApiResponse<{ saved: true; profile: CandidateProfile | null }>;

      if (!json.success) {
        setFileError(json.error.message);
        return;
      }

      onReplaced(resume.id, {
        fileName: result.fileName,
        pageCount: result.pageCount,
        charCount: result.charCount,
        updatedAt: new Date().toISOString(),
      });
      setReplacing(false);
      if (json.data.profile) onExtracted?.(json.data.profile);
    } catch {
      setFileError('Network error — please try again.');
    } finally {
      setSavingFile(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/resumes/${resume.id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ deleted: true; newActiveResumeId: string | null }>;

      if (!json.success) {
        setDeleteError(json.error.message);
        setConfirmingDelete(false);
        return;
      }
      onDeleted(resume.id, json.data.newActiveResumeId);
    } catch {
      setDeleteError('Network error — please try again.');
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex items-center gap-1.5">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') {
                    setEditingName(false);
                    setNameDraft(resume.name);
                  }
                }}
                autoFocus
                disabled={savingName}
                className={`${inputClass} py-1 text-sm`}
              />
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                aria-label="Save name"
                className="text-[var(--color-success)] disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setNameDraft(resume.name);
                }}
                disabled={savingName}
                aria-label="Cancel rename"
                className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-[var(--color-text)]">{resume.name}</p>
              {resume.isActive && (
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    color: 'var(--color-success)',
                    backgroundColor: 'color-mix(in oklch, var(--color-success) 15%, transparent)',
                  }}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditingName(true)}
                aria-label={`Rename ${resume.name}`}
                className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {nameError && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {nameError}
            </p>
          )}
          <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">
            {resume.fileName} · {resume.pageCount} page{resume.pageCount === 1 ? '' : 's'} ·{' '}
            {resume.charCount.toLocaleString('en-US')} characters · updated{' '}
            {new Date(resume.updatedAt).toLocaleDateString('en-US')}
          </p>
        </div>

        {!resume.isActive && (
          <button
            type="button"
            onClick={activate}
            disabled={activating}
            className="shrink-0 text-xs font-semibold text-[var(--color-accent)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activating ? 'Switching…' : 'Set active'}
          </button>
        )}
      </div>

      {replacing ? (
        <div className="space-y-2">
          <ResumeUploadZone onParsed={handleReplaceParsed} onClear={() => {}} disabled={savingFile} />
          {savingFile && <p className="text-xs text-[var(--color-text-muted)]">Saving resume…</p>}
          {fileError && (
            <p role="alert" className="text-xs" style={{ color: 'var(--color-danger)' }}>
              {fileError}
            </p>
          )}
          <button
            type="button"
            onClick={() => setReplacing(false)}
            disabled={savingFile}
            className="text-xs font-medium text-[var(--color-text-faint)] hover:underline disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-2.5">
          {confirmingDelete ? (
            <div className="flex w-full items-center justify-between gap-2 text-xs">
              <span className="text-[var(--color-text-faint)]">Delete this resume?</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="font-medium text-[var(--color-text-faint)] hover:underline disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="font-semibold text-[var(--color-danger)] hover:underline disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setReplacing(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                Replace file
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label={`Delete ${resume.name}`}
                className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
      {deleteError && (
        <p role="alert" className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {deleteError}
        </p>
      )}
    </div>
  );
}
