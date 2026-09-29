import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, FileText, TrendingUp, FileCheck2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { JobCard } from '@/components/dashboard/JobCard';
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

  const hasResume = !!profile?.resume_text;
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
              <p className="mt-1.5 text-2xl font-semibold text-[var(--color-text)]">{jobs.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center gap-1.5 text-[var(--color-text-faint)]">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">Avg. match</span>
              </div>
              <p className="mt-1.5 text-2xl font-semibold text-[var(--color-accent)]">{avgScore}%</p>
            </div>
            <div className="col-span-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[var(--color-text-faint)]">
                <span className="text-xs font-medium uppercase tracking-wide">Best match</span>
              </div>
              <p className="mt-1.5 truncate text-2xl font-semibold text-[var(--color-success)]">
                {bestJob.match_score}%
              </p>
            </div>
          </div>
        )}

        {!hasResume && (
          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              You haven&apos;t uploaded a resume yet.{' '}
              <Link href="/profile" className="font-semibold text-[var(--color-text)] underline">
                Add one to your profile
              </Link>{' '}
              before running an analysis.
            </p>
          </div>
        )}

        {jobs && jobs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                style={{ animationDelay: `${120 + Math.min(i, 8) * 50}ms` }}
                className="animate-fade-in-up"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-text-faint)]">
            No job analyses yet. Run your first one from &quot;New Analysis&quot;.
          </div>
        )}
      </main>
    </div>
  );
}
