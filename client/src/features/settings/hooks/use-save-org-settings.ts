import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orgSettingsSchema, type OrgSettingsInput } from "@/lib/domain/settings";
import { updateOrgSettings } from "@/features/settings/api/update-org-settings";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveOrgSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrgSettingsInput) => {
      // Client-side `can()` check is UX-only — RLS policy `org_settings_write`
      // is the authoritative gate (requires app_role() = 'it_admin').
      const me = await getCurrentMember();
      if (!me || !can(me.role, "changeSettings")) throw new Error("not-allowed");
      const parsed = orgSettingsSchema.parse(input);
      await updateOrgSettings(parsed);
      await logActivity({
        actorId: me.id,
        action: "settings.updated",
        entityType: "settings",
        entityId: null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orgSettings });
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
