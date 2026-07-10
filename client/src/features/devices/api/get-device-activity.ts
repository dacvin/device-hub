import { queryOptions, useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { getDevicesQueryOptions } from './get-paginated-devices';

import type { DeviceActivityAction } from './get-recent-activities';

export type DeviceActivityEntityType = 'devices' | 'checkouts' | 'checkins';

export type DeviceActivityEntry = {
  id: string;
  entityType: DeviceActivityEntityType;
  action: DeviceActivityAction;
  actorName: string | null;
  createdAt: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

type Row = {
  id: string;
  entity_type: DeviceActivityEntityType;
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

  const devicesClause = `and(entity_type.eq.devices,entity_id.eq.${deviceId})`;

  const { data: checkouts, error: checkoutsError } = await supabase
    .from('checkouts')
    .select('id')
    .eq('device_id', deviceId);
  if (checkoutsError) throw checkoutsError;
  const checkoutIds = checkouts.map((c) => c.id);

  let checkinIds: string[] = [];
  if (checkoutIds.length > 0) {
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('id')
      .in('checkout_id', checkoutIds);
    if (checkinsError) throw checkinsError;
    checkinIds = checkins.map((c) => c.id);
  }

  const clauses = [devicesClause];
  if (checkoutIds.length > 0) {
    clauses.push(`and(entity_type.eq.checkouts,entity_id.in.(${checkoutIds.join(',')}))`);
  }
  if (checkinIds.length > 0) {
    clauses.push(`and(entity_type.eq.checkins,entity_id.in.(${checkinIds.join(',')}))`);
  }

  const { data, error } = await supabase
    .from('activities')
    .select('id, entity_type, action, created_at, before, after, actor:users(name)')
    .or(clauses.join(','))
    .order('created_at', { ascending: false })
    .limit(limit)
    .overrideTypes<Row[]>();
  if (error) throw error;

  return data.map((r) => ({
    id: r.id,
    entityType: r.entity_type,
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
