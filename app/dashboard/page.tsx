import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, Circle, FileText, TrendingUp, FileCheck2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { JobGrid } from '@/components/dashboard/JobGrid';
import { CountUpNumber } from '@/components/dashboard/CountUpNumber';
import type { JobAnalysisRow, Profile } from '@/types/db';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;

  const [{ data: jobsData }, { data: profileData }] = await Promise.all([
    supabase.from('job_analyses').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').single(),
  ]);
  const jobs = jobsData as JobAnalysisRow[] | null;
  const profile = profileData as Profile | null;

  const hasResume = !!profile?.active_resume_id;
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const displayName = profile?.full_name ?? email;

  const avgScore = jobs?.length
    ? Math.round(jobs.reduce((sum, j) => sum + j.match_score, 0) / jobs.length)
    : null;
  const bestJob = jobs?.length
    ? jobs.reduce((best, j) => (j.match_score > best.match_score ? j : best))
    : null;

  return (
    <div className="min-h-screen">
      <AppNav displayName={displayName} />

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <div className="animate-fade-in-up flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--color-text)]">
              {firstName ? `Welcome back, ${firstName}` : 'Your job matches'}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {jobs?.length
                ? `${jobs.length} analysis${jobs.length === 1 ? '' : 'es'} on file`
                : 'Run your first analysis to see it here'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/generate-resume"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <FileText className="h-4 w-4" />
              Generate Resume
            </Link>
            <Link
              href="/analyze"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--color-canvas)] shadow-[0_4px_20px_-4px_color-mix(in_oklch,var(--color-accent)_50%,transparent)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              New Analysis
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {jobs && jobs.length > 0 && avgScore !== null && bestJob && (
          <div className="animate-fade-in-up grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ animationDelay: '60ms' }}>
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center gap-1.5 text-[var(--color-text-faint)]">
                <FileCheck2 className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">Analyses</span>
              </div>
              <CountUpNumber value={jobs.length} className="mt-1.5 block text-2xl font-semibold text-[var(--color-text)]" />
            </div>
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center gap-1.5 text-[var(--color-text-faint)]">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">Avg. match</span>
              </div>
              <CountUpNumber
                value={avgScore}
                suffix="%"
                className="mt-1.5 block text-2xl font-semibold text-[var(--color-accent)]"
              />
            </div>
            <div className="col-span-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[var(--color-text-faint)]">
                <span className="text-xs font-medium uppercase tracking-wide">Best match</span>
              </div>
              <CountUpNumber
                value={bestJob.match_score}
                suffix="%"
                className="mt-1.5 block truncate text-2xl font-semibold text-[var(--color-success)]"
              />
            </div>
          </div>
        )}

        {(!hasResume || (jobs?.length ?? 0) === 0) && (
          <div className="animate-fade-in-up rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5">
            <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">Get started</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2.5">
                {hasResume ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--color-success)' }} />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[var(--color-text-faint)]" />
                )}
                <span
                  className={`text-sm ${hasResume ? 'text-[var(--color-text-faint)] line-through' : 'text-[var(--color-text-muted)]'}`}
                >
                  Add your resume
                </span>
                {!hasResume && (
                  <Link href="/profile" className="ml-auto text-xs font-semibold text-[var(--color-accent)] hover:underline">
                    Go to profile
                  </Link>
                )}
              </li>
              <li className="flex items-center gap-2.5">
                {(jobs?.length ?? 0) > 0 ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--color-success)' }} />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[var(--color-text-faint)]" />
                )}
                <span
                  className={`text-sm ${(jobs?.length ?? 0) > 0 ? 'text-[var(--color-text-faint)] line-through' : 'text-[var(--color-text-muted)]'}`}
                >
                  Run your first analysis
                </span>
                {hasResume && (jobs?.length ?? 0) === 0 && (
                  <Link href="/analyze" className="ml-auto text-xs font-semibold text-[var(--color-accent)] hover:underline">
                    Start now
                  </Link>
                )}
              </li>
            </ul>
          </div>
        )}

        {jobs && jobs.length > 0 && <JobGrid jobs={jobs} />}
      </main>
    </div>
  );
}
