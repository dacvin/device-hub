import { createClient } from "@/lib/supabase/client";
import type { MemberRole, MemberRow, MemberStatus } from "../types";

export async function listMembers(): Promise<MemberRow[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("users")
    .select(
      `id, auth_user_id, name, email, phone, role, status, joined_at, last_active_at`,
    )
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  type Row = {
    id: string;
    auth_user_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    role: MemberRole;
    status: MemberStatus;
    joined_at: string | null;
    last_active_at: string | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    authUserId: r.auth_user_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    status: r.status,
    joinedAt: r.joined_at,
    lastActiveAt: r.last_active_at,
    isSelf: !!user && r.auth_user_id === user.id,
  }));
}
