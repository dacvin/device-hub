import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purgeRetiredDevices } from "@/features/settings/api/purge-retired-devices";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function usePurgeRetired() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const me = await getCurrentMember();
      if (!me || !can(me.role, "changeSettings")) throw new Error("not-allowed");
      const count = await purgeRetiredDevices();
      await logActivity({
        actorId: me.id,
        action: "settings.updated",
        entityType: "settings",
        entityId: null,
        metadata: { purged: count },
      });
      return count;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
