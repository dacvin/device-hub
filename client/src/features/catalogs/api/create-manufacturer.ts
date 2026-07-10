import { useMutation, useQueryClient } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { isUniqueViolation } from '../utils/map-postgrest-error';
import {
  createManufacturerFormSchema,
  type CreateManufacturerFormValues,
} from '../validations/manufacturer';
import { getManufacturersQueryOptions } from './get-paginated-manufacturers';

import type { Manufacturer } from '../types/manufacturer';

export const createManufacturer = async (
  input: CreateManufacturerFormValues,
): Promise<Manufacturer> => {
  const supabase = createClient();
  const values = createManufacturerFormSchema.parse(input);
  const { data, error } = await supabase
    .from('manufacturers')
    .insert(snakecaseKeys(values))
    .select()
    .single();
  if (error) {
    if (isUniqueViolation(error)) throw new Error('catalogs.duplicateName');
    throw error;
  }
  return camelcaseKeys(data);
};

type UseCreateManufacturerOptions = { mutationConfig?: MutationConfig<typeof createManufacturer> };

export const useCreateManufacturer = ({ mutationConfig }: UseCreateManufacturerOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: createManufacturer,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getManufacturersQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...rest,
  });
};
