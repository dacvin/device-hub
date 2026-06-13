import { createClient } from "@/lib/supabase/client";
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

export async function getCurrentMember(): Promise<Member | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("member")
    .select(memberSelect)
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMemberRow(data as unknown as MemberJoinedRow) : null;
}
