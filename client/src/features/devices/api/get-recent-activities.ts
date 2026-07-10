import { queryOptions, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { getDevicesQueryOptions } from './get-paginated-devices';

export type DeviceActivityAction = 'insert' | 'update' | 'delete' | 'restore';

export type DeviceActivity = {
  id: string;
  action: DeviceActivityAction;
  entityId: string | null;
  entityLabel: string | null;
  actorName: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  action: DeviceActivityAction;
  entity_id: string | null;
  entity_label: string | null;
  created_at: string;
  actor: { name: string } | null;
};

// Recent device audit-log entries. The activities table is written by the
// devices_log_activity trigger for every insert/update/delete/restore.
export const getRecentActivities = async (limit = 8): Promise<DeviceActivity[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('id, action, entity_id, entity_label, created_at, actor:users(name)')
    .eq('entity_type', 'devices')
    .order('created_at', { ascending: false })
    .limit(limit)
    .overrideTypes<Row[]>();
  if (error) throw error;

  return data.map((r) => ({
    ...camelcaseKeys({
      id: r.id,
      action: r.action,
      entity_id: r.entity_id,
      entity_label: r.entity_label,
      created_at: r.created_at,
    }),
    actorName: r.actor?.name ?? null,
  }));
};

export const getRecentActivitiesQueryOptions = () =>
  queryOptions({
    queryKey: [...getDevicesQueryOptions().queryKey, 'recent-activities'],
    queryFn: () => getRecentActivities(),
  });

export const useRecentActivities = (
  queryConfig?: QueryConfig<typeof getRecentActivitiesQueryOptions>,
) => useQuery({ ...getRecentActivitiesQueryOptions(), ...queryConfig });
