import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

export type CatalogFkColumn = 'group_id' | 'manufacturer_id';

export class CatalogInUseError extends Error {
  count: number;
  constructor(count: number) {
    super('catalogs.deleteInUse');
    this.name = 'CatalogInUseError';
    this.count = count;
  }
}

export async function assertNotInUse(
  supabase: SupabaseClient<Database>,
  fkColumn: CatalogFkColumn,
  id: string,
): Promise<void> {
  const { count, error } = await supabase
    .from('devices')
    .select('id', { count: 'exact', head: true })
    .eq(fkColumn, id)
    .is('deleted_at', null);

  if (error) throw error;
  if ((count ?? 0) > 0) throw new CatalogInUseError(count ?? 0);
}
