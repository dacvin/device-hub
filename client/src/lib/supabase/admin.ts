import 'server-only';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';
import { serverEnv } from '@/config/env.server';
import type { Database } from '@/types/database.types';

// Service-role client — bypasses RLS. Server-only; never import in client code.
export function createAdminClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
