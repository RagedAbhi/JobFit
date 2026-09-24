import { createBrowserClient } from '@supabase/ssr';

// Safe to call repeatedly (e.g. from multiple client components) -- creates
// a lightweight client bound to the singleton auth state in the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
