import { useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentFormSchema, type DepartmentFormValues } from "@/lib/domain/devices";
import { createDepartment } from "@/features/departments/api/create-department";
import { updateDepartment } from "@/features/departments/api/update-department";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: DepartmentFormValues }) => {
      const parsed = departmentFormSchema.parse(values);
      const me = await getCurrentMember();
      const row = id ? await updateDepartment(id, parsed) : await createDepartment(parsed);
      await logActivity({
        actorId: me?.id ?? null,
        action: id ? "catalog.updated" : "catalog.created",
        entityType: "department",
        entityId: row.id,
        entityLabel: row.name,
      });
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.departments.all });
      qc.invalidateQueries({ queryKey: queryKeys.departments.withCounts });
    },
  });
}
