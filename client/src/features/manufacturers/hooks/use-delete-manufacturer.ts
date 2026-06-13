import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteManufacturer } from "@/features/manufacturers/api/delete-manufacturer";
import { getManufacturerById } from "@/features/manufacturers/api/get-manufacturer";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useDeleteManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const [row, me] = await Promise.all([getManufacturerById(id), getCurrentMember()]);
      await deleteManufacturer(id);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.deleted",
        entityType: "manufacturer",
        entityId: id,
        entityLabel: row?.name ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.withCounts });
    },
  });
}
