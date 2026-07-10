import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

// Handles both entry points that land here:
// - Invite/magic links carry ?token_hash=...&type=... (verifyOtp)
// - Google OAuth carries ?code=... (exchangeCodeForSession)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nextParam = searchParams.get('next') ?? '/';
  // Prevent open redirect: resolve against a dummy origin and only allow
  // paths that stay same-origin (blocks //evil.com, /\evil.com, and absolute URLs).
  let next = '/';
  try {
    const resolved = new URL(nextParam, 'http://localhost');
    if (resolved.origin === 'http://localhost') {
      next = resolved.pathname + resolved.search + resolved.hash;
    }
  } catch {
    next = '/';
  }
  const supabase = await createClient();

  // If someone is already signed in, an invite/recovery/OAuth link must NOT
  // silently swap their session into another account (verifyOtp/exchangeCode
  // would overwrite the session cookies). Bounce to the app and leave the token
  // unconsumed, so the intended recipient can still use their link. To accept a
  // link as a new user, sign out first.
  const { data: claimsData } = await supabase.auth.getClaims();
  if (claimsData?.claims) redirect('/');

  const code = searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) redirect('/login?error=exchange_failed');
    redirect(next);
  }

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) redirect('/login?error=verify_failed');
    redirect(next);
  }

  redirect('/login?error=invalid_link');
}
