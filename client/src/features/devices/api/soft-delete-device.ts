import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { getDevicesQueryOptions } from './get-paginated-devices';

export const softDeleteDevice = async (deviceId: string): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from('devices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', deviceId);
  if (error) throw error;
};

type UseSoftDeleteDeviceOptions = { mutationConfig?: MutationConfig<typeof softDeleteDevice> };

export const useSoftDeleteDevice = ({ mutationConfig }: UseSoftDeleteDeviceOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: softDeleteDevice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...rest,
  });
};
