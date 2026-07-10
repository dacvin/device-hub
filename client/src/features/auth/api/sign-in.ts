import { createClient } from '@/lib/supabase/client';

import { signInSchema, type SignInValues } from '../validations/auth';

export async function signInWithPassword(values: SignInValues): Promise<void> {
  const { email, password } = signInSchema.parse(values);
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/confirm?next=/`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new Error(error.message);
}
