import type { CamelCaseKeys } from 'camelcase-keys';

import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

export type Manufacturer = CamelCaseKeys<Tables<'manufacturers'>>;
export type ManufacturerInsert = CamelCaseKeys<TablesInsert<'manufacturers'>>;
export type ManufacturerUpdate = CamelCaseKeys<TablesUpdate<'manufacturers'>>;

export type ManufacturerListItem = Pick<
  Manufacturer,
  'id' | 'name' | 'supportContact' | 'createdAt'
>;
