import { Constants } from '@/types/database.types';

export const DeviceStatuses = Constants.public.Enums.device_status;
export const DeviceSources = Constants.public.Enums.device_source;
export const DeviceUnits = Constants.public.Enums.device_unit;

// Sortable columns (snake_case — matches DB columns).
export const DEVICE_SORTABLE_COLUMNS = [
  'code',
  'name',
  'status',
  'condition',
  'created_at',
] as const;
