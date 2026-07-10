import { useMutation, useQueryClient } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { isUniqueViolation } from '../utils/map-postgrest-error';
import { updateGroupFormSchema, type UpdateGroupFormValues } from '../validations/group';
import { getGroupsQueryOptions } from './get-paginated-groups';

import type { Group } from '../types/group';

export const updateGroup = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateGroupFormValues;
}): Promise<Group> => {
  const supabase = createClient();
  const values = updateGroupFormSchema.parse(data);
  const { data: row, error } = await supabase
    .from('groups')
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

type UseUpdateGroupOptions = { mutationConfig?: MutationConfig<typeof updateGroup> };

export const useUpdateGroup = ({ mutationConfig }: UseUpdateGroupOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: updateGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getGroupsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...rest,
  });
};
