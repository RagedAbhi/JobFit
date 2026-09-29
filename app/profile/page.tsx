import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';
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
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">Your Profile</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Your resume is uploaded once and reused for every job analysis. Replace it any time, and edit
            the extracted details below.
          </p>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <ProfilePageClient initialProfile={profile} />
        </div>
      </main>
    </div>
  );
}
