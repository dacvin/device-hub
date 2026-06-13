import { createClient } from "@/lib/supabase/client";
import { mapMemberRow, type Member, type MemberRole, type MemberRow } from "@/lib/domain/members";
import { escapePostgrestFilter } from "@/lib/queries/_filter";

type MemberJoinedRow = MemberRow & {
  department: { name: string } | null;
  reports_to_member: { name: string } | null;
};

const memberSelect = `
  *,
  department:department_id(name),
  reports_to_member:reports_to(name)
`;

export interface MemberListFilters {
  q?: string;
  role?: MemberRole | "all";
}

export async function listMembers(filters: MemberListFilters = {}): Promise<Member[]> {
  const supabase = createClient();
  let q = supabase.from("member").select(memberSelect).order("name");

  if (filters.role && filters.role !== "all") {
    q = q.eq("role", filters.role);
  }
  if (filters.q) {
    const term = filters.q.trim();
    if (term) {
      const safe = escapePostgrestFilter(term);
      q = q.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`);
    }
  }
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as MemberJoinedRow[]).map(mapMemberRow);
}
