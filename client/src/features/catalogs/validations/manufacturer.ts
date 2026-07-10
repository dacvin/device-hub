import { z } from 'zod';

const nullableText = z
  .string()
  .trim()
  .transform((v) => (v.length ? v : null))
  .nullable()
  .optional()
  .transform((v) => v ?? null);

export const createManufacturerFormSchema = z.object({
  name: z.string().trim().min(1, { message: 'validation.nameRequired' }),
  supportContact: nullableText,
});

export type CreateManufacturerFormValues = z.infer<typeof createManufacturerFormSchema>;

export const updateManufacturerFormSchema = createManufacturerFormSchema;
export type UpdateManufacturerFormValues = z.infer<typeof updateManufacturerFormSchema>;
