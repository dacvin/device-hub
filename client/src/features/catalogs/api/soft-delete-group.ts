import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { assertNotInUse } from '../utils/in-use-guard';
import { getGroupsQueryOptions } from './get-paginated-groups';

export const softDeleteGroup = async (id: string): Promise<void> => {
  const supabase = createClient();
  await assertNotInUse(supabase, 'group_id', id); // throws CatalogInUseError if referenced
  const { error } = await supabase
    .from('groups')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

type UseSoftDeleteGroupOptions = { mutationConfig?: MutationConfig<typeof softDeleteGroup> };

export const useSoftDeleteGroup = ({ mutationConfig }: UseSoftDeleteGroupOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: softDeleteGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getGroupsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...rest,
  });
};
