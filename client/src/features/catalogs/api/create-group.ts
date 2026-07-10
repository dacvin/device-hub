import { useMutation, useQueryClient } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { isUniqueViolation } from '../utils/map-postgrest-error';
import { createGroupFormSchema, type CreateGroupFormValues } from '../validations/group';
import { getGroupsQueryOptions } from './get-paginated-groups';

import type { Group } from '../types/group';

export const createGroup = async (input: CreateGroupFormValues): Promise<Group> => {
  const supabase = createClient();
  const values = createGroupFormSchema.parse(input);
  const { data, error } = await supabase
    .from('groups')
    .insert(snakecaseKeys(values))
    .select()
    .single();
  if (error) {
    if (isUniqueViolation(error)) throw new Error('catalogs.duplicateName');
    throw error;
  }
  return camelcaseKeys(data);
};

type UseCreateGroupOptions = { mutationConfig?: MutationConfig<typeof createGroup> };

export const useCreateGroup = ({ mutationConfig }: UseCreateGroupOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: createGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getGroupsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...rest,
  });
};
