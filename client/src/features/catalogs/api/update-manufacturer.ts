import { useMutation, useQueryClient } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { isUniqueViolation } from '../utils/map-postgrest-error';
import {
  updateManufacturerFormSchema,
  type UpdateManufacturerFormValues,
} from '../validations/manufacturer';
import { getManufacturersQueryOptions } from './get-paginated-manufacturers';

import type { Manufacturer } from '../types/manufacturer';

export const updateManufacturer = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateManufacturerFormValues;
}): Promise<Manufacturer> => {
  const supabase = createClient();
  const values = updateManufacturerFormSchema.parse(data);
  const { data: row, error } = await supabase
    .from('manufacturers')
    .update(snakecaseKeys(values))
    .eq('id', id)
    .select()
    .single();
  if (error) {
    if (isUniqueViolation(error)) throw new Error('catalogs.duplicateName');
    throw error;
  }
  return camelcaseKeys(row);
};

type UseUpdateManufacturerOptions = { mutationConfig?: MutationConfig<typeof updateManufacturer> };

export const useUpdateManufacturer = ({ mutationConfig }: UseUpdateManufacturerOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: updateManufacturer,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getManufacturersQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...rest,
  });
};
