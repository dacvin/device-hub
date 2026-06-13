import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupFormSchema, type GroupFormValues } from "@/lib/domain/devices";
import { createGroup } from "@/features/groups/api/create-group";
import { updateGroup } from "@/features/groups/api/update-group";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: GroupFormValues }) => {
      const parsed = groupFormSchema.parse(values);
      const me = await getCurrentMember();
      const row = id ? await updateGroup(id, parsed) : await createGroup(parsed);
      await logActivity({
        actorId: me?.id ?? null,
        action: id ? "catalog.updated" : "catalog.created",
        entityType: "device_group",
        entityId: row.id,
        entityLabel: row.name,
      });
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      qc.invalidateQueries({ queryKey: queryKeys.groups.withCounts });
    },
  });
}
