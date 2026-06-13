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

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("member")
    .select(memberSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMemberRow(data as unknown as MemberJoinedRow) : null;
}
