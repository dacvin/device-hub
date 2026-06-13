import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMemberRole } from "@/features/members/api/update-member-role";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can, type MemberRole } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: MemberRole }) => {
      const me = await getCurrentMember();
      if (!me || !can(me.role, "manageMembers")) throw new Error("not-allowed");
      await updateMemberRole(memberId, role);
      await logActivity({
        actorId: me.id,
        action: "member.role_changed",
        entityType: "member",
        entityId: memberId,
        metadata: { to: role },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}
