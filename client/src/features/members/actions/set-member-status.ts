'use server';

import { getCurrentAppUser } from '@/lib/auth/current-user';
import { createClient } from '@/lib/supabase/server';

import type { UserStatus } from '../types/member';

export async function setMemberStatus({
  userId,
  status,
}: {
  userId: string;
  status: Extract<UserStatus, 'active' | 'deactivated'>;
}): Promise<void> {
  const caller = await getCurrentAppUser();
  if (caller?.role !== 'admin') throw new Error('errors.notAdmin');

  const supabase = await createClient();
  const { error } = await supabase.from('users').update({ status }).eq('id', userId);
  if (error) throw new Error('errors.generic');
}
