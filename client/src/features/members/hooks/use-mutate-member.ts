import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { inviteMember, type InviteInput } from "../api/invite-member";
import {
  removeMember,
  setMemberStatus,
  updateMemberRole,
  updateOwnProfile,
  type OwnProfileInput,
} from "../api/mutate-member";
import type { MemberRole, MemberStatus } from "../types";

function invalidateMembers(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.members.all });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteInput) => inviteMember(input),
    onSuccess: () => invalidateMembers(qc),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: MemberRole }) =>
      updateMemberRole(id, role),
    onSuccess: () => invalidateMembers(qc),
  });
}

export function useSetMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MemberStatus }) =>
      setMemberStatus(id, status),
    onSuccess: () => invalidateMembers(qc),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeMember(id),
    onSuccess: () => invalidateMembers(qc),
  });
}

export function useUpdateOwnProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OwnProfileInput) => updateOwnProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.current });
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}
