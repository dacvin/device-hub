import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { makeListParamsSchema } from '@/features/catalogs/utils/parse-list-params';
import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { DEVICE_SORTABLE_COLUMNS, DeviceStatuses } from '../constants/device';
import { buildDeviceSearch } from './search-filter';

import type { DeviceListItem } from '../types/device';

// Root query-options for the devices namespace: its key is the shared prefix that
// every device query builds on and every device mutation invalidates.
export const getDevicesQueryOptions = () => queryOptions({ queryKey: ['devices'] as const });

const baseSchema = makeListParamsSchema(DEVICE_SORTABLE_COLUMNS, {
  column: 'created_at',
  ascending: false,
});

const listParamsSchema = baseSchema.extend({
  status: z
    .union([z.enum(DeviceStatuses), z.array(z.enum(DeviceStatuses))])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()
    .catch(undefined),
  group: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()
    .catch(undefined),
});

type DeviceRow = {
  id: string;
  code: string;
  name: string;
  status: DeviceListItem['status'];
  condition: number;
  quantity: number;
  location: string | null;
  created_at: string;
  group: { name: string } | null;
  manufacturer: { name: string } | null;
};

export const getPaginatedDevices = async (
  params: Record<string, unknown> = {},
): Promise<{ items: DeviceListItem[]; total: number; page: number; limit: number }> => {
  const { page, limit, q, status, group, sort } = listParamsSchema.parse(params);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createClient();
  let query = supabase
    .from('devices')
    .select(
      'id, code, name, status, condition, quantity, location, created_at, group:groups(name), manufacturer:manufacturers(name)',
      { count: 'exact' },
    )
    .is('deleted_at', null);

  if (status?.length) query = query.in('status', status);
  if (group?.length) query = query.in('group_id', group);
  if (q) query = query.or(buildDeviceSearch(q));
  for (const { column, ascending } of sort) query = query.order(column, { ascending });

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const rows = data as unknown as DeviceRow[];
  const items: DeviceListItem[] = rows.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    status: d.status,
    condition: d.condition,
    quantity: d.quantity,
    location: d.location,
    groupName: d.group?.name ?? null,
    manufacturerName: d.manufacturer?.name ?? null,
    createdAt: d.created_at,
  }));

  return { items, total: count ?? 0, page, limit };
};

export const getPaginatedDevicesQueryOptions = (params: Record<string, unknown> = {}) => {
  const parsed = listParamsSchema.parse(params);
  return queryOptions({
    queryKey: [...getDevicesQueryOptions().queryKey, parsed],
    queryFn: () => getPaginatedDevices(parsed),
    placeholderData: keepPreviousData,
  });
};

type UsePaginatedDevicesOptions = {
  params: Record<string, unknown>;
  queryConfig?: QueryConfig<typeof getPaginatedDevicesQueryOptions>;
};

export const usePaginatedDevices = ({ params, queryConfig }: UsePaginatedDevicesOptions) =>
  useQuery({ ...getPaginatedDevicesQueryOptions(params), ...queryConfig });
