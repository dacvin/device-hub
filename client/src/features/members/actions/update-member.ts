'use server';

import { createClient } from '@/lib/supabase/server';

import { updateMemberSchema, type UpdateMemberValues } from '../validations/member';

export async function updateMember({
  userId,
  data,
}: {
  userId: string;
  data: UpdateMemberValues;
}): Promise<void> {
  const { name, phone } = updateMemberSchema.parse(data);

  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({ name, phone: phone.trim() ? phone.trim() : null })
    .eq('id', userId);
  // RLS enforces self (name/phone only) or admin. A blocked update affects 0
  // rows without erroring, which is acceptable — the caller re-reads via query.
  if (error) throw new Error('errors.generic');
}
