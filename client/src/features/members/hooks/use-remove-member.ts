import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeMember } from "@/features/members/api/remove-member";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const me = await getCurrentMember();
      if (!me || !can(me.role, "manageMembers")) throw new Error("not-allowed");
      const email = await removeMember(memberId);
      await logActivity({
        actorId: me.id,
        action: "member.removed",
        entityType: "member",
        entityId: memberId,
        entityLabel: email,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}
