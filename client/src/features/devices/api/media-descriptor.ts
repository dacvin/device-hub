import { z } from 'zod';

import { deviceFileDescriptorSchema } from '../validations/device';

import type { DeviceFileDescriptor } from '../types/device';

// devices.photos / devices.documents store descriptors snake_cased. camelcaseKeys
// is shallow and won't touch these nested JSONB objects, so map explicitly.
const dbDescriptorSchema = z.object({
  path: z.string(),
  file_name: z.string(),
  size_bytes: z.number(),
  mime_type: z.string(),
  sort_order: z.number(),
  uploaded_at: z.string(),
});

export function toDbDescriptor(d: DeviceFileDescriptor) {
  return {
    path: d.path,
    file_name: d.fileName,
    size_bytes: d.sizeBytes,
    mime_type: d.mimeType,
    sort_order: d.sortOrder,
    uploaded_at: d.uploadedAt,
  };
}

export function fromDbDescriptors(raw: unknown): DeviceFileDescriptor[] {
  const rows = z
    .array(dbDescriptorSchema)
    .catch([])
    .parse(raw ?? []);
  return rows
    .map((r) => ({
      path: r.path,
      fileName: r.file_name,
      sizeBytes: r.size_bytes,
      mimeType: r.mime_type,
      sortOrder: r.sort_order,
      uploadedAt: r.uploaded_at,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((d) => deviceFileDescriptorSchema.parse(d));
}
