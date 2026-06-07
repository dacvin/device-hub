import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapMemberRow, type Member, type MemberRow } from "@/lib/domain/members";

type MemberJoinedRow = MemberRow & {
  department: { name: string } | null;
  reports_to_member: { name: string } | null;
};

const memberSelect = `
  *,
  department:department_id(name),
  reports_to_member:reports_to(name)
`;

/**
 * The signed-in user's member row.
 * Returns null if the user has no member record (should not happen after
 * the auth-callback bootstrap; callers may treat null as "not allowed").
 */
export const getCurrentMember = cache(async (): Promise<Member | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("member")
    .select(memberSelect)
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMemberRow(data as unknown as MemberJoinedRow) : null;
});
