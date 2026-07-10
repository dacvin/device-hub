import 'server-only';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/server';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'invited' | 'deactivated';
};

// Resolves the signed-in auth user to their public.users row (RLS-scoped).
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  return data ? camelcaseKeys(data) : null;
}
