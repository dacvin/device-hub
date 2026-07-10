import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import type { DeviceDetail } from '../types/device';

type Joined = { name: string } | null;

export const getDevice = async (deviceId: string): Promise<DeviceDetail> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('devices')
    .select('*, group:groups(name), manufacturer:manufacturers(name)')
    .eq('id', deviceId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  const rawData = data as unknown as {
    group: Joined;
    manufacturer: Joined;
    [key: string]: unknown;
  };

  const { group, manufacturer, ...rest } = rawData;
  const camelRest = camelcaseKeys(rest);

  return {
    ...camelRest,
    groupName: group?.name ?? null,
    manufacturerName: manufacturer?.name ?? null,
  } as DeviceDetail;
};

// `deviceId` may be undefined mid-waterfall; skipToken keeps the query idle until it's ready.
// See .claude/reference/api/queries.md → "Dependent / waterfall query".
export const getDeviceQueryOptions = (deviceId: string | undefined) =>
  queryOptions({
    queryKey: ['device', deviceId],
    queryFn: deviceId ? () => getDevice(deviceId) : skipToken,
  });

type UseDeviceOptions = {
  deviceId: string | undefined;
  queryConfig?: QueryConfig<typeof getDeviceQueryOptions>;
};

export const useDevice = ({ deviceId, queryConfig }: UseDeviceOptions) =>
  useQuery({
    ...getDeviceQueryOptions(deviceId),
    ...queryConfig,
    // skipToken + a truthy `enabled` throws "Missing queryFn" (TanStack #7057), so
    // force the query off until the id is ready. Once it is, the caller's `enabled` applies.
    ...(deviceId ? {} : { enabled: false }),
  });
