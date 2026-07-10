import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { fromDbDescriptors } from '@/features/devices/api/media-descriptor';
import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { checkoutStatus } from '../constants/checkout';

import type { Checkin, CheckoutListItem, CheckoutWithDetail } from '../types/checkout';

// Root query-options for the checkouts namespace: the shared prefix.
export const getCheckoutsQueryOptions = () => queryOptions({ queryKey: ['checkouts'] as const });

const SELECT =
  '*, device:devices(code, name), checked_out_by_user:users!checkouts_checked_out_by_fkey(name), checkins(*)';

type Row = {
  id: string;
  device_id: string;
  borrower_name: string;
  quantity: number;
  checked_out_at: string;
  expected_return_date: string | null;
  device: { code: string; name: string } | null;
  checked_out_by_user: { name: string } | null;
  checkins: { quantity: number }[];
};

function outstandingOf(quantity: number, checkins: { quantity: number }[]): number {
  return quantity - checkins.reduce((sum, c) => sum + c.quantity, 0);
}

export const getCheckoutsList = async (): Promise<CheckoutListItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checkouts')
    .select(SELECT)
    .order('checked_out_at', { ascending: false });
  if (error) throw error;

  return (data as unknown as Row[]).map((r) => {
    const outstanding = outstandingOf(r.quantity, r.checkins);
    return {
      id: r.id,
      deviceId: r.device_id,
      deviceCode: r.device?.code ?? '—',
      deviceName: r.device?.name ?? '—',
      borrowerName: r.borrower_name,
      quantity: r.quantity,
      outstanding,
      checkedOutByName: r.checked_out_by_user?.name ?? null,
      checkedOutAt: r.checked_out_at,
      expectedReturnDate: r.expected_return_date,
      status: checkoutStatus(outstanding, r.expected_return_date),
    };
  });
};

export const getCheckoutsListQueryOptions = () =>
  queryOptions({
    queryKey: [...getCheckoutsQueryOptions().queryKey, 'list'],
    queryFn: getCheckoutsList,
  });

export const useCheckoutsList = (queryConfig?: QueryConfig<typeof getCheckoutsListQueryOptions>) =>
  useQuery({ ...getCheckoutsListQueryOptions(), ...queryConfig });

// Full detail for one device's checkouts (active + closed), newest first.
export const getDeviceCheckouts = async (deviceId: string): Promise<CheckoutWithDetail[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('checkouts')
    .select(SELECT)
    .eq('device_id', deviceId)
    .order('checked_out_at', { ascending: false });
  if (error) throw error;

  return (data as unknown as (Row & { checkins: Record<string, unknown>[] })[]).map((r) => {
    const checkins = (r.checkins as unknown[]).map((c) => {
      const cam = camelcaseKeys(c as Record<string, unknown>) as unknown as Checkin;
      return { ...cam, photos: fromDbDescriptors((c as { photos: unknown }).photos) };
    });
    const outstanding = outstandingOf(
      r.quantity,
      checkins.map((c) => ({ quantity: c.quantity })),
    );
    const base = camelcaseKeys(
      // strip the joined relations before camelizing the checkout row
      Object.fromEntries(
        Object.entries(r).filter(
          ([k]) => !['device', 'checked_out_by_user', 'checkins'].includes(k),
        ),
      ) as Record<string, unknown>,
    );
    return {
      ...(base as unknown as CheckoutWithDetail),
      deviceCode: r.device?.code ?? '—',
      deviceName: r.device?.name ?? '—',
      checkedOutByName: r.checked_out_by_user?.name ?? null,
      checkins,
      outstanding,
      status: checkoutStatus(outstanding, r.expected_return_date),
    };
  });
};

export const getDeviceCheckoutsQueryOptions = (deviceId: string | undefined) =>
  queryOptions({
    queryKey: [...getCheckoutsQueryOptions().queryKey, 'device', deviceId],
    queryFn: deviceId ? () => getDeviceCheckouts(deviceId) : skipToken,
  });

export const useDeviceCheckouts = (deviceId: string | undefined) =>
  useQuery({
    ...getDeviceCheckoutsQueryOptions(deviceId),
    ...(deviceId ? {} : { enabled: false }),
  });
