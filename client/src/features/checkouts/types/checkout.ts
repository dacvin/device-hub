import type { CamelCaseKeys } from 'camelcase-keys';

// Photos are the same generic file-descriptor shape as device media.
import type {
  DeviceFileDescriptor,
  DeviceStatus,
  DeviceType,
} from '@/features/devices/types/device';
import type { Enums, Tables, TablesInsert } from '@/types/database.types';

export type Checkout = CamelCaseKeys<Tables<'checkouts'>>;
export type CheckoutInsert = CamelCaseKeys<TablesInsert<'checkouts'>>;
export type Checkin = CamelCaseKeys<Tables<'checkins'>>;
export type CheckinOutcome = Enums<'checkin_outcome'>;

export type { DeviceFileDescriptor as CheckoutFileDescriptor };

// Derived, never stored.
export type CheckoutStatus = 'outstanding' | 'overdue' | 'closed';

// getDeviceCheckouts deep-converts a checkin's `photos` from raw JSONB into
// typed descriptors before handing it to the UI.
export type CheckinWithPhotos = Omit<Checkin, 'photos'> & { photos: DeviceFileDescriptor[] };

// A checkout + its device + checkins + derived fields, for the device panel.
export type CheckoutWithDetail = Checkout & {
  deviceCode: string;
  deviceName: string;
  deviceType: DeviceType;
  deviceQuantity: number;
  deviceStatus: DeviceStatus;
  checkedOutByName: string | null;
  checkins: CheckinWithPhotos[];
  outstanding: number;
  status: CheckoutStatus;
};

// Row for the /checkouts list table.
export type CheckoutListItem = {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  borrowerName: string;
  quantity: number;
  outstanding: number;
  checkedOutByName: string | null;
  checkedOutAt: string;
  expectedReturnDate: string | null;
  status: CheckoutStatus;
};

// One row of public.device_loan_status.
export type DeviceLoanStatus = {
  deviceId: string;
  total: number;
  onLoan: number;
  available: number;
  hasOverdue: boolean;
  activeCheckouts: number;
};
