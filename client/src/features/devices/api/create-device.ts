import { useMutation, useQueryClient } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

import { isUniqueViolation } from '@/features/catalogs/utils/map-postgrest-error';
import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';
import type { TablesInsert } from '@/types/database.types';

import { createDeviceFormSchema, type CreateDeviceFormValues } from '../validations/device';
import { getDevicesQueryOptions } from './get-paginated-devices';

import type { Device } from '../types/device';

// Nullable columns: empty form strings become SQL NULL. `source` is a nullable enum.
const NULLABLE_KEYS = [
  'model',
  'serialNumber',
  'specifications',
  'notes',
  'source',
  'location',
  'importDate',
  'lastCheckDate',
  'warrantyStart',
  'warrantyEnd',
] as const;

export function toDbPayload(values: CreateDeviceFormValues): TablesInsert<'devices'> {
  const out: Record<string, unknown> = { ...values };
  for (const key of NULLABLE_KEYS) {
    if (out[key] === '') out[key] = null;
  }
  return snakecaseKeys(out) as TablesInsert<'devices'>;
}

export const createDevice = async (input: CreateDeviceFormValues): Promise<Device> => {
  const supabase = createClient();
  const values = createDeviceFormSchema.parse(input);
  const { data, error } = await supabase
    .from('devices')
    .insert(toDbPayload(values))
    .select()
    .single();
  if (error) {
    if (isUniqueViolation(error)) throw new Error('devices.duplicateCode');
    throw error;
  }
  return camelcaseKeys(data);
};

type UseCreateDeviceOptions = { mutationConfig?: MutationConfig<typeof createDevice> };

export const useCreateDevice = ({ mutationConfig }: UseCreateDeviceOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: createDevice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...rest,
  });
};
