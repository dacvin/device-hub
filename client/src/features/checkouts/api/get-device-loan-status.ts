import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';

import { getCheckoutsQueryOptions } from './get-checkouts';

import type { DeviceLoanStatus } from '../types/checkout';

export const fetchLoanStatusFor = async (deviceIds: string[]): Promise<DeviceLoanStatus[]> => {
  if (deviceIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('device_loan_status')
    .select('*')
    .in('device_id', deviceIds);
  if (error) throw error;
  return camelcaseKeys(data) as DeviceLoanStatus[];
};

export const getDeviceLoanStatusQueryOptions = (deviceId: string | undefined) =>
  queryOptions({
    queryKey: [...getCheckoutsQueryOptions().queryKey, 'loan-status', deviceId],
    queryFn: deviceId ? async () => (await fetchLoanStatusFor([deviceId]))[0] ?? null : skipToken,
  });

export const useDeviceLoanStatus = (deviceId: string | undefined) =>
  useQuery({
    ...getDeviceLoanStatusQueryOptions(deviceId),
    ...(deviceId ? {} : { enabled: false }),
  });
