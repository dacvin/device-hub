import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mapMemberRow, type Member, type MemberRole, type MemberRow } from "@/lib/domain/members";
import { escapePostgrestFilter } from "@/lib/data/_filter";

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
  const supabase = await createClient();
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

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member")
    .select(memberSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMemberRow(data as unknown as MemberJoinedRow) : null;
}

export async function countDevicesManagedBy(departmentId: string | null): Promise<number> {
  if (!departmentId) return 0;
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("device")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("department_id", departmentId);
  if (error) throw error;
  return count ?? 0;
}
