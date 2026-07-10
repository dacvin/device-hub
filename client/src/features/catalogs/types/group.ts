import type { CamelCaseKeys } from 'camelcase-keys';

import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

export type Group = CamelCaseKeys<Tables<'groups'>>;
export type GroupInsert = CamelCaseKeys<TablesInsert<'groups'>>;
export type GroupUpdate = CamelCaseKeys<TablesUpdate<'groups'>>;

export type GroupListItem = Pick<
  Group,
  'id' | 'name' | 'icon' | 'defaultInventoryCycleMonths' | 'createdAt'
>;
