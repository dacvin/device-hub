import { queryOptions, useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { getDevicesQueryOptions } from './get-paginated-devices';

import type { DeviceActivityAction } from './get-recent-activities';

// before/after are full snake_case row snapshots, so any field-level diff is
// reconstructable client-side without extra columns.
export type DeviceActivityEntry = {
  id: string;
  action: DeviceActivityAction;
  actorName: string | null;
  createdAt: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

type Row = {
  id: string;
  action: DeviceActivityAction;
  created_at: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  actor: { name: string } | null;
};

export const getDeviceActivity = async (
  deviceId: string,
  limit = 8,
): Promise<DeviceActivityEntry[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('id, action, created_at, before, after, actor:users(name)')
    .eq('entity_type', 'devices')
    .eq('entity_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .overrideTypes<Row[]>();
  if (error) throw error;

  return data.map((r) => ({
    id: r.id,
    action: r.action,
    actorName: r.actor?.name ?? null,
    createdAt: r.created_at,
    before: r.before ?? {},
    after: r.after ?? {},
  }));
};

export const getDeviceActivityQueryOptions = (deviceId: string) =>
  queryOptions({
    queryKey: [...getDevicesQueryOptions().queryKey, deviceId, 'activity'],
    queryFn: () => getDeviceActivity(deviceId),
  });

export const useDeviceActivity = (
  deviceId: string,
  queryConfig?: QueryConfig<typeof getDeviceActivityQueryOptions>,
) => useQuery({ ...getDeviceActivityQueryOptions(deviceId), ...queryConfig });
