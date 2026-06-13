import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteMember } from "@/features/members/api/invite-member";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can, type InviteMemberInput } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      const me = await getCurrentMember();
      if (!me || !can(me.role, "manageMembers")) throw new Error("not-allowed");
      const id = await inviteMember(input, me.id);
      await logActivity({
        actorId: me.id,
        action: "member.invited",
        entityType: "member",
        entityId: id,
        entityLabel: input.email,
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}
