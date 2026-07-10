import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { type ListParams, listParamsSchema } from '../validations/member';
import { buildNameEmailSearch } from './search-filter';

import type { MemberListItem } from '../types/member';

export const getPaginatedUsers = async ({
  page,
  limit,
  q,
  role,
  status,
  sort,
}: ListParams): Promise<{
  items: MemberListItem[];
  total: number;
  page: number;
  limit: number;
}> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createClient();

  let query = supabase
    .from('users')
    .select('id, name, email, phone, role, status, joined_at', { count: 'exact' })
    .is('deleted_at', null);

  if (q) query = query.or(buildNameEmailSearch(q));
  if (role?.length) query = query.in('role', role);
  if (status?.length) query = query.in('status', status);

  for (const { column, ascending } of sort) {
    query = query.order(column, { ascending });
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return {
    items: camelcaseKeys(data),
    total: count ?? 0,
    page,
    limit,
  };
};

export const getPaginatedUsersQueryOptions = (params: Record<string, unknown> = {}) => {
  const parsed = listParamsSchema.parse(params);
  return queryOptions({
    queryKey: ['users', parsed],
    queryFn: () => getPaginatedUsers(parsed),
    placeholderData: keepPreviousData,
  });
};

type UsePaginatedUsersOptions = {
  params: Record<string, unknown>;
  queryConfig?: QueryConfig<typeof getPaginatedUsersQueryOptions>;
};

export const usePaginatedUsers = ({ params, queryConfig }: UsePaginatedUsersOptions) =>
  useQuery({
    ...getPaginatedUsersQueryOptions(params),
    ...queryConfig,
  });
