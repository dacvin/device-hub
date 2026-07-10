import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { MANUFACTURER_SORTABLE_COLUMNS } from '../constants/catalog';
import { makeListParamsSchema } from '../utils/parse-list-params';

import type { ManufacturerListItem } from '../types/manufacturer';

// Root query-options for the manufacturers namespace: its key is the shared prefix that
// paginated manufacturers queries build on and manufacturers mutations invalidate.
export const getManufacturersQueryOptions = () =>
  queryOptions({ queryKey: ['manufacturers'] as const });

const listParamsSchema = makeListParamsSchema(MANUFACTURER_SORTABLE_COLUMNS, {
  column: 'name',
  ascending: true,
});

export const getPaginatedManufacturers = async (
  params: Record<string, unknown> = {},
): Promise<{ items: ManufacturerListItem[]; total: number; page: number; limit: number }> => {
  const { page, limit, q, sort } = listParamsSchema.parse(params);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createClient();
  let query = supabase
    .from('manufacturers')
    .select('id, name, support_contact, created_at', { count: 'exact' })
    .is('deleted_at', null);

  if (q) query = query.ilike('name', `%${q}%`);
  for (const { column, ascending } of sort) query = query.order(column, { ascending });

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return { items: camelcaseKeys(data), total: count ?? 0, page, limit };
};

export const getPaginatedManufacturersQueryOptions = (params: Record<string, unknown> = {}) => {
  const parsed = listParamsSchema.parse(params);
  return queryOptions({
    queryKey: [...getManufacturersQueryOptions().queryKey, parsed],
    queryFn: () => getPaginatedManufacturers(parsed),
    placeholderData: keepPreviousData,
  });
};

type UsePaginatedManufacturersOptions = {
  params: Record<string, unknown>;
  queryConfig?: QueryConfig<typeof getPaginatedManufacturersQueryOptions>;
};

export const usePaginatedManufacturers = ({
  params,
  queryConfig,
}: UsePaginatedManufacturersOptions) =>
  useQuery({ ...getPaginatedManufacturersQueryOptions(params), ...queryConfig });
