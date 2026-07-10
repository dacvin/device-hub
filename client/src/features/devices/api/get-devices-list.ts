import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { getDevicesQueryOptions } from './get-paginated-devices';

import type { DeviceListItem, DeviceStatus } from '../types/device';

type Row = {
  id: string;
  code: string;
  name: string;
  status: DeviceStatus;
  condition: number;
  quantity: number;
  location: string | null;
  serial_number: string | null;
  created_at: string;
  photos: { path: string }[] | null;
  group: { name: string } | null;
  manufacturer: { name: string } | null;
};

// All active devices as list items — the list page is a client-side data table
// (sort/filter/paginate in memory) over this single cached query, so filtering
// is instant and needs no per-interaction refetch. The fleet is small (hundreds).
export const getDevicesList = async (): Promise<DeviceListItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('devices')
    .select(
      'id, code, name, status, condition, quantity, location, serial_number, created_at, photos, group:groups(name), manufacturer:manufacturers(name)',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .overrideTypes<Row[]>();

  if (error) throw error;
  return data.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    status: d.status,
    condition: d.condition,
    quantity: d.quantity,
    location: d.location,
    serialNumber: d.serial_number,
    groupName: d.group?.name ?? null,
    manufacturerName: d.manufacturer?.name ?? null,
    createdAt: d.created_at,
    coverPath: d.photos?.[0]?.path ?? null,
  }));
};

export const getDevicesListQueryOptions = () =>
  queryOptions({
    queryKey: [...getDevicesQueryOptions().queryKey, 'list-all'],
    queryFn: getDevicesList,
    placeholderData: keepPreviousData,
  });

export const useDevicesList = (queryConfig?: QueryConfig<typeof getDevicesListQueryOptions>) =>
  useQuery({ ...getDevicesListQueryOptions(), ...queryConfig });
