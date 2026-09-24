import Link from 'next/link';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <span
          className="mx-auto mb-3 inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: 'var(--color-accent)' }}
          aria-hidden
        />
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">Create your account</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Upload your resume once, match it against as many jobs as you like
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
        <SignupForm />
      </div>

      <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--color-accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
