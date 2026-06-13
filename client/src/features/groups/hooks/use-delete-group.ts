import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGroup } from "@/features/groups/api/delete-group";
import { getGroupById } from "@/features/groups/api/get-group";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const [row, me] = await Promise.all([getGroupById(id), getCurrentMember()]);
      await deleteGroup(id);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.deleted",
        entityType: "device_group",
        entityId: id,
        entityLabel: row?.name ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      qc.invalidateQueries({ queryKey: queryKeys.groups.withCounts });
    },
  });
}
