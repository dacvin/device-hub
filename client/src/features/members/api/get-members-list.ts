import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import type { MemberListItem } from '../types/member';

// All active members as list items — the members page is a client-side data
// table over this single cached query (instant sort/filter/paginate). Keyed
// under the ['users'] prefix so member mutations refresh it.
export const getMembersList = async (): Promise<MemberListItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, role, status, joined_at')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) throw error;
  return camelcaseKeys(data);
};

export const getMembersListQueryOptions = () =>
  queryOptions({
    queryKey: ['users', 'list-all'],
    queryFn: getMembersList,
    placeholderData: keepPreviousData,
  });

export const useMembersList = (queryConfig?: QueryConfig<typeof getMembersListQueryOptions>) =>
  useQuery({ ...getMembersListQueryOptions(), ...queryConfig });
