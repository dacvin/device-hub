import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

export const deviceFormSchema = z
  .object({
    name: z.string().trim().min(1, "Required").max(80, "Max 80 characters"),
    code: z.string().trim().min(1, "Required"),
    groupId: z.string().uuid("Required"),
    status: z.enum(["in-use", "storage", "repair", "retired"]),
    manufacturerId: z.string().uuid("Required"),
    model: z.string().trim().max(120).optional().or(z.literal("")),
    serialNumber: z.string().trim().max(120).optional().or(z.literal("")),
    unitId: z.string().uuid("Required"),
    quantity: z.number().int().min(1, "Must be ≥ 1"),
    specifications: z.string().max(500).optional().or(z.literal("")),
    source: z
      .enum(["Purchased", "Leased", "Donated", "Transferred"])
      .optional()
      .or(z.literal("")),
    importDate: isoDate,
    condition: z.number().int().min(0).max(100),
    location: z.string().max(160).optional().or(z.literal("")),
    lastCheckDate: isoDate,
    inventoryCycleMonths: z.number().int().min(1).max(120),
    warrantyStart: isoDate,
    warrantyEnd: isoDate,
    notes: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine(
    (val) => {
      if (!val.warrantyStart || !val.warrantyEnd) return true;
      return val.warrantyEnd >= val.warrantyStart;
    },
    { message: "Warranty end must be on or after warranty start", path: ["warrantyEnd"] },
  );

export type DeviceFormValues = z.infer<typeof deviceFormSchema>;
