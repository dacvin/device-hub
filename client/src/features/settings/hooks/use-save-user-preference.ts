import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userPreferenceSchema, type UserPreferenceInput } from "@/lib/domain/settings";
import { upsertUserPreference } from "@/features/settings/api/upsert-user-preference";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveUserPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UserPreferenceInput) => {
      const me = await getCurrentMember();
      if (!me) throw new Error("not-allowed");
      const parsed = userPreferenceSchema.parse(input);
      await upsertUserPreference(me.id, parsed);
      return me.id;
    },
    onSuccess: (userId) => {
      qc.invalidateQueries({ queryKey: queryKeys.userPreference(userId) });
    },
  });
}
