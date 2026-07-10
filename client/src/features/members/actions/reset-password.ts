'use server';

import { headers } from 'next/headers';

import { getCurrentAppUser } from '@/lib/auth/current-user';
import { createAdminClient } from '@/lib/supabase/admin';

export async function resetPassword({ email }: { email: string }): Promise<{ actionLink: string }> {
  const caller = await getCurrentAppUser();
  if (caller?.role !== 'admin') throw new Error('errors.notAdmin');

  const admin = createAdminClient();
  const origin = (await headers()).get('origin') ?? 'http://127.0.0.1:3000';
  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email });
  if (error) throw new Error('errors.generic');

  // Link to OUR confirm route with the token as a query param (GoTrue's raw
  // action_link returns the session in a URL fragment the server route can't
  // read). verifyOtp runs server-side, then redirects to /auth/set-password.
  const actionLink = `${origin}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery&next=/auth/set-password`;
  return { actionLink };
}
