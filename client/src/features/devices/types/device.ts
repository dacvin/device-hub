import type { CamelCaseKeys } from 'camelcase-keys';

import type { Enums, Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

export type DeviceStatus = Enums<'device_status'>;
export type DeviceSource = Enums<'device_source'>;

export type Device = CamelCaseKeys<Tables<'devices'>>;
export type DeviceInsert = CamelCaseKeys<TablesInsert<'devices'>>;
export type DeviceUpdate = CamelCaseKeys<TablesUpdate<'devices'>>;

// Row shape for the list table (joined catalog names flattened by hand).
export type DeviceListItem = {
  id: string;
  code: string;
  name: string;
  status: DeviceStatus;
  condition: number;
  location: string | null;
  serialNumber?: string | null;
  groupName: string | null;
  manufacturerName: string | null;
  createdAt: string;
};

// A photo/document entry inside devices.photos / devices.documents JSONB arrays.
export type DeviceFileDescriptor = {
  path: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  sortOrder: number;
  uploadedAt: string;
};

// Detail page shape: full row + joined catalog names.
export type DeviceDetail = Device & {
  groupName: string | null;
  manufacturerName: string | null;
};
