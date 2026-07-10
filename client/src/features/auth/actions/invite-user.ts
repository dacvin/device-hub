'use server';

import { headers } from 'next/headers';

import { getCurrentAppUser } from '@/lib/auth/current-user';
import { createAdminClient } from '@/lib/supabase/admin';

import { inviteSchema, type InviteValues } from '../validations/auth';

// Admin-only. Inserts the allowlist row FIRST (so the before_user_created
// hook will permit the invite), then generates an action link the admin
// shares manually. No email is sent.
export async function inviteUser(input: InviteValues): Promise<{ actionLink: string }> {
  const caller = await getCurrentAppUser();
  if (caller?.role !== 'admin') {
    throw new Error('errors.notAdmin');
  }

  const { name, email } = inviteSchema.parse(input);
  const admin = createAdminClient();

  const { error: insertError } = await admin.from('users').insert({
    name,
    email,
    role: 'member',
    status: 'invited',
    invited_by: caller.id,
  });
  if (insertError) {
    const msg = insertError.message;
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505')) {
      throw new Error('errors.duplicateEmail');
    }
    throw new Error('errors.generic');
  }

  const origin = (await headers()).get('origin') ?? 'http://127.0.0.1:3000';
  const { data, error } = await admin.auth.admin.generateLink({ type: 'invite', email });
  if (error) throw new Error('errors.generic');

  // Link to OUR confirm route with the token as a query param (not GoTrue's raw
  // action_link, which returns the session in a URL fragment the server route
  // can't read → dead-ends on /login). verifyOtp runs server-side and sets the
  // SSR session, then redirects to /auth/set-password.
  const actionLink = `${origin}/auth/confirm?token_hash=${data.properties.hashed_token}&type=invite&next=/auth/set-password`;
  return { actionLink };
}
