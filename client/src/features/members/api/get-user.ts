import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import type { MemberDetail } from '../types/member';

export const getUser = async (userId: string): Promise<MemberDetail> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();
  if (error) throw error;
  return camelcaseKeys(data);
};

export const getUserQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ['user', userId],
    queryFn: userId ? () => getUser(userId) : skipToken,
  });

type UseUserOptions = {
  userId: string | undefined;
  queryConfig?: QueryConfig<typeof getUserQueryOptions>;
};

export const useUser = ({ userId, queryConfig }: UseUserOptions) =>
  useQuery({
    ...getUserQueryOptions(userId),
    ...queryConfig,
    ...(userId ? {} : { enabled: false }),
  });
