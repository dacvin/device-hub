import { z } from 'zod';

import { DeviceSources, DeviceStatuses, DeviceTypes, DeviceUnits } from '../constants/device';

// Nullable text/date fields live as '' in the form (never null); the API layer
// converts '' → null on write.
const nullableText = z.string().trim().catch('');
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.dateInvalid' })
  .or(z.literal(''))
  .catch('');

export const createDeviceFormSchema = z
  .object({
    code: z.string().trim().min(1, { message: 'validation.codeRequired' }),
    name: z.string().trim().min(1, { message: 'validation.nameRequired' }),
    groupId: z.uuid({ message: 'validation.groupRequired' }),
    unit: z.enum(DeviceUnits, { message: 'validation.unitRequired' }),
    manufacturerId: z.uuid({ message: 'validation.manufacturerRequired' }),
    model: nullableText,
    serialNumber: nullableText,
    specifications: nullableText,
    notes: nullableText,
    status: z.enum(DeviceStatuses, { message: 'validation.statusRequired' }),
    type: z.enum(DeviceTypes, { message: 'validation.typeRequired' }),
    condition: z.coerce
      .number()
      .int()
      .min(0, { message: 'validation.conditionRange' })
      .max(100, { message: 'validation.conditionRange' }),
    quantity: z.coerce.number().int().min(0, { message: 'validation.quantityNonNegative' }),
    source: z.enum(DeviceSources).or(z.literal('')),
    location: nullableText,
    importDate: dateString,
    lastCheckDate: dateString,
    inventoryCycleMonths: z.coerce
      .number()
      .int()
      .min(1, { message: 'validation.cycleRange' })
      .max(120, { message: 'validation.cycleRange' }),
    warrantyStart: dateString,
    warrantyEnd: dateString,
  })
  .refine((v) => !v.warrantyStart || !v.warrantyEnd || v.warrantyEnd >= v.warrantyStart, {
    message: 'validation.warrantyRange',
    path: ['warrantyEnd'],
  })
  // serialized devices hold at most one unit (mirrors the DB constraint)
  .refine((v) => v.type === 'accessory' || v.quantity <= 1, {
    message: 'validation.deviceQuantityLocked',
    path: ['quantity'],
  });

export const deviceFileDescriptorSchema = z.object({
  path: z.string().min(1),
  fileName: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  mimeType: z.string(),
  sortOrder: z.number().int().nonnegative(),
  uploadedAt: z.string(),
});

export type CreateDeviceFormValues = z.infer<typeof createDeviceFormSchema>;

export const updateDeviceFormSchema = createDeviceFormSchema;
export type UpdateDeviceFormValues = z.infer<typeof updateDeviceFormSchema>;

export const DEVICE_FORM_DEFAULTS: CreateDeviceFormValues = {
  code: '',
  name: '',
  groupId: '',
  unit: 'piece',
  manufacturerId: '',
  model: '',
  serialNumber: '',
  specifications: '',
  notes: '',
  status: 'storage',
  type: 'device',
  condition: 100,
  quantity: 1,
  source: '',
  location: '',
  importDate: '',
  lastCheckDate: '',
  inventoryCycleMonths: 12,
  warrantyStart: '',
  warrantyEnd: '',
};
