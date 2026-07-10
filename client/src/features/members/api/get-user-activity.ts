import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import type { Activity } from '../types/member';

export const getUserActivity = async (userId: string, limit = 10): Promise<Activity[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('actor_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return camelcaseKeys(data);
};

export const getUserActivityQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ['user-activity', userId],
    queryFn: userId ? () => getUserActivity(userId) : skipToken,
  });

type UseUserActivityOptions = {
  userId: string | undefined;
  queryConfig?: QueryConfig<typeof getUserActivityQueryOptions>;
};

export const useUserActivity = ({ userId, queryConfig }: UseUserActivityOptions) =>
  useQuery({
    ...getUserActivityQueryOptions(userId),
    ...queryConfig,
    ...(userId ? {} : { enabled: false }),
  });
