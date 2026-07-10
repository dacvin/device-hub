import { createClient } from '@/lib/supabase/client';

import { setPasswordSchema, type SetPasswordValues } from '../validations/auth';

export async function setPassword(values: SetPasswordValues): Promise<void> {
  const { password } = setPasswordSchema.parse(values);
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}
