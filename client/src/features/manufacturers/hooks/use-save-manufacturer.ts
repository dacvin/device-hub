import { useMutation, useQueryClient } from "@tanstack/react-query";
import { manufacturerFormSchema, type ManufacturerFormValues } from "@/lib/domain/devices";
import { createManufacturer } from "@/features/manufacturers/api/create-manufacturer";
import { updateManufacturer } from "@/features/manufacturers/api/update-manufacturer";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: ManufacturerFormValues }) => {
      const parsed = manufacturerFormSchema.parse(values);
      const me = await getCurrentMember();
      const row = id ? await updateManufacturer(id, parsed) : await createManufacturer(parsed);
      await logActivity({
        actorId: me?.id ?? null,
        action: id ? "catalog.updated" : "catalog.created",
        entityType: "manufacturer",
        entityId: row.id,
        entityLabel: row.name,
      });
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.withCounts });
    },
  });
}
