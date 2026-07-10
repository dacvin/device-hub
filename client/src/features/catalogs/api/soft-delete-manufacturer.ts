import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { assertNotInUse } from '../utils/in-use-guard';
import { getManufacturersQueryOptions } from './get-paginated-manufacturers';

export const softDeleteManufacturer = async (id: string): Promise<void> => {
  const supabase = createClient();
  await assertNotInUse(supabase, 'manufacturer_id', id); // throws CatalogInUseError if referenced
  const { error } = await supabase
    .from('manufacturers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

type UseSoftDeleteManufacturerOptions = {
  mutationConfig?: MutationConfig<typeof softDeleteManufacturer>;
};

export const useSoftDeleteManufacturer = ({
  mutationConfig,
}: UseSoftDeleteManufacturerOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: softDeleteManufacturer,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getManufacturersQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...rest,
  });
};
