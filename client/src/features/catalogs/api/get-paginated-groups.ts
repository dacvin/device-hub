import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { GROUP_SORTABLE_COLUMNS } from '../constants/catalog';
import { makeListParamsSchema } from '../utils/parse-list-params';

import type { GroupListItem } from '../types/group';

// Root query-options for the groups namespace: its key is the shared prefix that
// paginated groups queries build on and groups mutations invalidate.
export const getGroupsQueryOptions = () => queryOptions({ queryKey: ['groups'] as const });

const listParamsSchema = makeListParamsSchema(GROUP_SORTABLE_COLUMNS, {
  column: 'name',
  ascending: true,
});

export const getPaginatedGroups = async (
  params: Record<string, unknown> = {},
): Promise<{ items: GroupListItem[]; total: number; page: number; limit: number }> => {
  const { page, limit, q, sort } = listParamsSchema.parse(params);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createClient();
  let query = supabase
    .from('groups')
    .select('id, name, icon, default_inventory_cycle_months, created_at', { count: 'exact' })
    .is('deleted_at', null);

  if (q) query = query.ilike('name', `%${q}%`);
  for (const { column, ascending } of sort) query = query.order(column, { ascending });

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return { items: camelcaseKeys(data), total: count ?? 0, page, limit };
};

export const getPaginatedGroupsQueryOptions = (params: Record<string, unknown> = {}) => {
  const parsed = listParamsSchema.parse(params);
  return queryOptions({
    queryKey: [...getGroupsQueryOptions().queryKey, parsed],
    queryFn: () => getPaginatedGroups(parsed),
    placeholderData: keepPreviousData,
  });
};

type UsePaginatedGroupsOptions = {
  params: Record<string, unknown>;
  queryConfig?: QueryConfig<typeof getPaginatedGroupsQueryOptions>;
};

export const usePaginatedGroups = ({ params, queryConfig }: UsePaginatedGroupsOptions) =>
  useQuery({ ...getPaginatedGroupsQueryOptions(params), ...queryConfig });
