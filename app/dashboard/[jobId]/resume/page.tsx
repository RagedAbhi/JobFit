import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { TailoredResumeClient } from '@/components/resume/TailoredResumeClient';
import type { JobAnalysisRow, Profile } from '@/types/db';

export default async function TailoredResumePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;

  const [{ data: jobData }, { data: profileData }] = await Promise.all([
    supabase.from('job_analyses').select('*').eq('id', jobId).single(),
    supabase.from('profiles').select('*').single(),
  ]);
  const job = jobData as JobAnalysisRow | null;
  const profile = profileData as Profile | null;
  const displayName = profile?.full_name ?? email;

  if (!job || !job.tailored_resume) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <div className="no-print">
        <AppNav displayName={displayName} />
      </div>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <TailoredResumeClient jobId={jobId} initialResume={job.tailored_resume} />
      </main>
    </div>
  );
}
