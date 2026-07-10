import { queryOptions, useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { DeviceStatuses } from '../constants/device';
import { getDevicesQueryOptions } from './get-paginated-devices';

import type { DeviceStatus } from '../types/device';

export type DueDevice = {
  id: string;
  code: string;
  name: string;
  /** Days overdue (positive) or until next check (negative). Null = never checked. */
  overdueDays: number | null;
};

export type FleetStats = {
  total: number;
  byStatus: Record<DeviceStatus, number>;
  avgCondition: number | null;
  locationsCount: number;
  topGroups: { name: string; count: number }[];
  dueForCheck: DueDevice[];
  dueCount: number;
};

type Row = {
  id: string;
  code: string;
  name: string;
  status: DeviceStatus;
  condition: number;
  location: string | null;
  last_check_date: string | null;
  inventory_cycle_months: number;
  group: { name: string } | null;
};

const emptyByStatus = () =>
  Object.fromEntries(DeviceStatuses.map((s) => [s, 0])) as Record<DeviceStatus, number>;

const DAY_MS = 86_400_000;
// Devices come into view once they are within this window of their next check.
const NEAR_DAYS = 30;

function rank(counts: Map<string, number>, limit: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

// Read-only fleet overview for the dashboard. The device set is small (hundreds),
// so a single lightweight projection aggregated in memory is simpler and cheaper
// than a fan-out of grouped count queries or a dedicated SQL view.
export const getFleetStats = async (): Promise<FleetStats> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('devices')
    .select(
      'id, code, name, status, condition, location, last_check_date, inventory_cycle_months, group:groups(name)',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .overrideTypes<Row[]>();

  if (error) throw error;
  const rows = data;

  const byStatus = emptyByStatus();
  const locations = new Set<string>();
  const groupCounts = new Map<string, number>();
  let conditionSum = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const due: DueDevice[] = [];

  for (const row of rows) {
    byStatus[row.status] += 1;
    conditionSum += row.condition;
    if (row.location) locations.add(row.location);
    const groupName = row.group?.name;
    if (groupName) groupCounts.set(groupName, (groupCounts.get(groupName) ?? 0) + 1);

    // Inventory-check flagging: overdue, due soon, or never checked.
    if (!row.last_check_date) {
      due.push({ id: row.id, code: row.code, name: row.name, overdueDays: null });
    } else {
      const next = new Date(row.last_check_date);
      next.setMonth(next.getMonth() + row.inventory_cycle_months);
      next.setHours(0, 0, 0, 0);
      const overdueDays = Math.round((todayMs - next.getTime()) / DAY_MS);
      if (overdueDays >= -NEAR_DAYS) {
        due.push({ id: row.id, code: row.code, name: row.name, overdueDays });
      }
    }
  }

  // Most urgent first: larger overdueDays first; never-checked (null) sorts last.
  due.sort((a, b) => (b.overdueDays ?? -Infinity) - (a.overdueDays ?? -Infinity));

  return {
    total: rows.length,
    byStatus,
    avgCondition: rows.length ? Math.round(conditionSum / rows.length) : null,
    locationsCount: locations.size,
    topGroups: rank(groupCounts, 6).map(({ key, count }) => ({ name: key, count })),
    dueForCheck: due.slice(0, 6),
    dueCount: due.length,
  };
};

// Keyed under the devices prefix so device create/update/delete (which invalidate
// the devices root key) also refresh the dashboard stats.
export const getFleetStatsQueryOptions = () =>
  queryOptions({
    queryKey: [...getDevicesQueryOptions().queryKey, 'fleet-stats'],
    queryFn: getFleetStats,
  });

export const useFleetStats = (queryConfig?: QueryConfig<typeof getFleetStatsQueryOptions>) =>
  useQuery({ ...getFleetStatsQueryOptions(), ...queryConfig });
