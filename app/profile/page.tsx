import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/layout/AppNav';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';
import type { Profile, Resume } from '@/types/db';
import type { ResumeListEntry } from '@/app/api/resumes/route';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;

  const [{ data: profileData }, { data: resumesData }] = await Promise.all([
    supabase.from('profiles').select('*').single(),
    supabase.from('resumes').select('*').order('updated_at', { ascending: false }),
  ]);
  const profile = profileData as Profile | null;
  const resumes = (resumesData as Resume[] | null) ?? [];
  const initialResumes: ResumeListEntry[] = resumes.map((r) => ({
    id: r.id,
    name: r.name,
    fileName: r.resume_filename,
    pageCount: r.resume_page_count,
    charCount: r.resume_char_count,
    updatedAt: r.updated_at,
    isActive: r.id === profile?.active_resume_id,
  }));
  const displayName = profile?.full_name ?? email;

  return (
    <div className="min-h-screen">
      <AppNav displayName={displayName} />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <div className="animate-fade-in-up">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">Your Profile</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Keep several named resumes and switch which one is active. Analyses and generated resumes use
            whichever resume you pick; edit the shared details below anytime.
          </p>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <ProfilePageClient initialProfile={profile} initialResumes={initialResumes} />
        </div>
      </main>
    </div>
  );
}
