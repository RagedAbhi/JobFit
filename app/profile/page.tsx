import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { ResumeManager } from '@/components/profile/ResumeManager';
import type { Profile } from '@/types/db';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;

  const { data } = await supabase.from('profiles').select('*').single();
  const profile = data as Profile | null;
  const displayName = profile?.full_name ?? email;

  return (
    <div className="min-h-screen">
      <AppNav displayName={displayName} />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <div className="animate-fade-in-up">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">Your Resume</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Uploaded once and reused for every job analysis. Replace it any time.
          </p>
        </div>

        <div className="animate-fade-in-up rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6" style={{ animationDelay: '80ms' }}>
          <ResumeManager initialProfile={profile} />
        </div>
      </main>
    </div>
  );
}
