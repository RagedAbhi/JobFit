import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { GenerateResumeFlow } from '@/components/dashboard/GenerateResumeFlow';
import type { Profile } from '@/types/db';

export default async function GenerateResumePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;

  const { data } = await supabase.from('profiles').select('*').single();
  const profile = data as Profile | null;
  // Tailoring needs the structured profile fields (summary/skills/work
  // history), not just the raw resume text -- same check as the API route.
  const hasProfileContent =
    !!profile && (!!profile.summary || profile.skills.length > 0 || profile.work_experience.length > 0);
  const displayName = profile?.full_name ?? email;

  return (
    <div className="min-h-screen">
      <AppNav displayName={displayName} />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <div className="animate-fade-in-up">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Generate Resume from Job Description
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Paste a job description and get a resume rewritten to target it -- summary, skill order, and
            experience bullets adjusted, using only what&apos;s already in your profile.
          </p>
        </div>

        {!hasProfileContent ? (
          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              Your profile needs some content first.{' '}
              <Link href="/profile" className="font-semibold text-[var(--color-text)] underline">
                Upload your resume
              </Link>{' '}
              so we have something to tailor.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
            <GenerateResumeFlow />
          </div>
        )}
      </main>
    </div>
  );
}
