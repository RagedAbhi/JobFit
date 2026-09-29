import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { MatchScoreGauge } from '@/components/MatchScoreGauge';
import { SkillMatrix } from '@/components/SkillMatrix';
import { SuggestionsList } from '@/components/SuggestionsList';
import { GenerateResumeButton } from '@/components/dashboard/GenerateResumeButton';
import type { JobAnalysisRow, Profile } from '@/types/db';

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;

  const [{ data }, { data: profileData }] = await Promise.all([
    supabase.from('job_analyses').select('*').eq('id', jobId).single(),
    supabase.from('profiles').select('*').single(),
  ]);
  const job = data as JobAnalysisRow | null;
  const profile = profileData as Profile | null;
  const displayName = profile?.full_name ?? email;

  if (!job) {
    notFound();
  }

  const date = new Date(job.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen">
      <AppNav displayName={displayName} />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">{job.job_title}</h1>
            <p className="text-sm text-[var(--color-text-faint)]">Analyzed {date}</p>
          </div>
          <GenerateResumeButton jobId={job.id} hasExisting={!!job.tailored_resume} />
        </div>

        <section className="space-y-8 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
          <MatchScoreGauge score={job.match_score} />
          <p className="text-center text-sm text-[var(--color-text-muted)]">{job.summary}</p>
          <SkillMatrix
            matching={job.matching_skills}
            missing={job.missing_skills}
            optional={job.optional_missing_skills}
          />
          <SuggestionsList suggestions={job.improvement_suggestions} />
        </section>

        <details className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-text)]">
            Job Description
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-text-muted)]">
            {job.job_description_text}
          </p>
        </details>
      </main>
    </div>
  );
}
