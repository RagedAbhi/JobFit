'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertTriangle } from 'lucide-react';
import { parsePdfToText, PdfParseError, type ParsedPdf } from '@/lib/pdf-parser';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface ResumeUploadZoneProps {
  onParsed: (result: ParsedPdf) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ResumeUploadZone({ onParsed, onClear, disabled }: ResumeUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedPdf | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setError('Only PDF files are supported.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError('File is too large. Max size is 5MB.');
        return;
      }

      setFileName(file.name);
      setIsParsing(true);
      try {
        const result = await parsePdfToText(file);
        setPreview(result);
        onParsed(result);
      } catch (err) {
        const message = err instanceof PdfParseError ? err.message : 'Unexpected error parsing PDF.';
        setError(message);
        setPreview(null);
        onClear();
      } finally {
        setIsParsing(false);
      }
    },
    [onParsed, onClear]
  );

  const clearFile = () => {
    setFileName(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear();
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-text)]">Resume (PDF)</span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          isDragging ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)] hover:border-[var(--color-text-faint)]'
        )}
        style={isDragging ? { backgroundColor: 'color-mix(in oklch, var(--color-accent) 8%, transparent)' } : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <UploadCloud className="mx-auto mb-2 h-8 w-8 text-[var(--color-text-faint)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Drag &amp; drop your resume PDF here, or click to browse (max 5MB)
        </p>
      </div>

      {isParsing && <p className="mt-2 text-sm text-[var(--color-text-muted)]">Parsing PDF…</p>}

      {error && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-danger)' }}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {fileName && preview && !isParsing && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--color-surface-raised)] p-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--color-text-faint)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">{fileName}</p>
              <p className="text-xs text-[var(--color-text-faint)]">
                {preview.pageCount} page{preview.pageCount === 1 ? '' : 's'} ·{' '}
                {preview.charCount.toLocaleString()} characters extracted
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            disabled={disabled}
            aria-label="Remove file"
            className="text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)] disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
