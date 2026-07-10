import { useMutation, useQueryClient } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { isUniqueViolation } from '@/features/catalogs/utils/map-postgrest-error';
import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { updateDeviceFormSchema, type UpdateDeviceFormValues } from '../validations/device';
import { toDbPayload } from './create-device';
import { getDeviceQueryOptions } from './get-device';
import { getDevicesQueryOptions } from './get-paginated-devices';

import type { Device } from '../types/device';

export const updateDevice = async ({
  deviceId,
  data,
}: {
  deviceId: string;
  data: UpdateDeviceFormValues;
}): Promise<Device> => {
  const supabase = createClient();
  const values = updateDeviceFormSchema.parse(data);
  const { data: row, error } = await supabase
    .from('devices')
    .update(toDbPayload(values))
    .eq('id', deviceId)
    .select()
    .single();
  if (error) {
    if (isUniqueViolation(error)) throw new Error('devices.duplicateCode');
    throw error;
  }
  return camelcaseKeys(row);
};

type UseUpdateDeviceOptions = { mutationConfig?: MutationConfig<typeof updateDevice> };

export const useUpdateDevice = ({ mutationConfig }: UseUpdateDeviceOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: updateDevice,
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      queryClient.invalidateQueries({
        queryKey: getDeviceQueryOptions(variables.deviceId).queryKey,
      });
      onSuccess?.(data, variables, ...args);
    },
    ...rest,
  });
};
