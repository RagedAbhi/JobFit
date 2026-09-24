import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { AnalyzeFlow } from '@/components/analyze/AnalyzeFlow';
import type { Profile } from '@/types/db';

export default async function AnalyzePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;

  const { data } = await supabase.from('profiles').select('*').single();
  const profile = data as Profile | null;
  const hasResume = !!profile?.resume_text;
  const displayName = profile?.full_name ?? email;

  return (
    <div className="min-h-screen">
      <AppNav displayName={displayName} />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <h1 className="animate-fade-in-up text-xl font-semibold tracking-tight text-[var(--color-text)]">
          New Analysis
        </h1>

        {!hasResume ? (
          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              You need a resume on file before running an analysis.{' '}
              <Link href="/profile" className="font-semibold text-[var(--color-text)] underline">
                Upload one now
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
            <AnalyzeFlow />
          </div>
        )}
      </main>
    </div>
  );
}
