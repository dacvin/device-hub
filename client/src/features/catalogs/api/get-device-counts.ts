import { queryOptions, useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

export type DeviceCounts = {
  byGroup: Record<string, number>;
  byManufacturer: Record<string, number>;
};

type Row = { group_id: string | null; manufacturer_id: string | null };

// Active-device counts keyed by group and manufacturer id. The device set is
// small (hundreds), so we project two FK columns and tally in memory rather
// than run a grouped aggregate per resource.
export const getDeviceCounts = async (): Promise<DeviceCounts> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('devices')
    .select('group_id, manufacturer_id')
    .is('deleted_at', null)
    .overrideTypes<Row[]>();
  if (error) throw error;

  const byGroup: Record<string, number> = {};
  const byManufacturer: Record<string, number> = {};
  for (const row of data) {
    if (row.group_id) byGroup[row.group_id] = (byGroup[row.group_id] ?? 0) + 1;
    if (row.manufacturer_id)
      byManufacturer[row.manufacturer_id] = (byManufacturer[row.manufacturer_id] ?? 0) + 1;
  }
  return { byGroup, byManufacturer };
};

export const getDeviceCountsQueryOptions = () =>
  queryOptions({ queryKey: ['catalog', 'device-counts'], queryFn: getDeviceCounts });

export const useDeviceCounts = (queryConfig?: QueryConfig<typeof getDeviceCountsQueryOptions>) =>
  useQuery({ ...getDeviceCountsQueryOptions(), ...queryConfig });
