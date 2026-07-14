import { Constants } from '@/types/database.types';

export const DeviceStatuses = Constants.public.Enums.device_status;
export const DeviceSources = Constants.public.Enums.device_source;
export const DeviceUnits = Constants.public.Enums.device_unit;
export const DeviceTypes = Constants.public.Enums.device_type;

// checked_out is automation-only (set by the checkout sync trigger) and
// never picked by hand in the form.
export const DEVICE_FORM_STATUS_OPTIONS = DeviceStatuses.filter((s) => s !== 'checked_out');

// Sortable columns (snake_case — matches DB columns).
export const DEVICE_SORTABLE_COLUMNS = [
  'code',
  'name',
  'status',
  'condition',
  'created_at',
] as const;
