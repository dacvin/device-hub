import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDepartment } from "@/features/departments/api/delete-department";
import { getDepartmentById } from "@/features/departments/api/get-department";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const [row, me] = await Promise.all([getDepartmentById(id), getCurrentMember()]);
      await deleteDepartment(id);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.deleted",
        entityType: "department",
        entityId: id,
        entityLabel: row?.name ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.departments.all });
      qc.invalidateQueries({ queryKey: queryKeys.departments.withCounts });
    },
  });
}
