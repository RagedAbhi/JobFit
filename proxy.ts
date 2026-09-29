import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup', '/auth/confirm'];

// Metadata routes Next.js generates from app/icon.tsx, app/apple-icon.tsx,
// app/opengraph-image.tsx, and app/twitter-image.tsx. Link-preview crawlers
// (Slack, LinkedIn, Twitter) and browser tabs fetch these anonymously --
// without this list they'd hit the auth redirect below and get an HTML
// login page back instead of an image.
const PUBLIC_METADATA_PATHS = ['/icon', '/apple-icon', '/opengraph-image', '/twitter-image'];

// Renamed from "middleware" to "proxy" as of Next.js 16 -- same convention,
// same signature, new file/export name.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: getClaims() must be called before any response is returned --
  // it's what triggers a token refresh (written back via setAll above) when
  // the access token is close to expiring. Skipping this causes random
  // logouts once the token expires.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = data?.claims != null;

  const pathname = request.nextUrl.pathname;
  const isPublicPath =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    PUBLIC_METADATA_PATHS.some((p) => pathname.startsWith(p));
  const isApiPath = pathname.startsWith('/api/');

  // API routes enforce their own auth and return a structured 401 JSON
  // response -- redirecting them here would make `fetch()` follow a
  // redirect to the login page's HTML instead of JSON, breaking the client.
  if (isApiPath) {
    return supabaseResponse;
  }

  if (!isAuthenticated && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|pdf.worker.min.mjs|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
