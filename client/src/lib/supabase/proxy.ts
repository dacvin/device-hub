import { type NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

import { env } from '@/config/env';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          // Forward Supabase's cache-control headers so CDNs never cache auth responses.
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  // IMPORTANT: Do not run code between createServerClient and getClaims().
  // getClaims() refreshes the auth token; do not remove it, or SSR users may be
  // randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  const { pathname } = request.nextUrl;
  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/auth');

  // A signed-in user has no reason to see the login page — send them to the app.
  // Scoped to /login only: /auth/set-password must stay reachable while
  // authenticated (the invite/recovery token creates a session precisely so the
  // user can set a password there). A deactivated session falls through to the
  // active-user gate below on the next request and is signed out.
  if (claims && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (!claims && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Second gate: authenticated but not an active allowlisted user → sign out.
  if (claims && !isPublic) {
    const { data: appUser } = await supabase
      .from('users')
      .select('status')
      .eq('auth_user_id', claims.sub)
      .is('deleted_at', null)
      .maybeSingle();

    if (!appUser || appUser.status !== 'active') {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = 'error=not_invited';
      // Carry the cookie-clearing headers set by signOut() onto the redirect.
      return NextResponse.redirect(url, { headers: supabaseResponse.headers });
    }
  }

  return supabaseResponse;
}
