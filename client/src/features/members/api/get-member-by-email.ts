import { createClient } from "@/lib/supabase/client";
import type { MemberRole, MemberRow, MemberStatus } from "../types";

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

export async function getMemberByEmail(email: string): Promise<MemberRow | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("users")
    .select(
      `id, auth_user_id, name, email, phone, role, status, joined_at, last_active_at`,
    )
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as unknown as Row;
  return {
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
  };
}

export async function getCurrentUserRow(): Promise<MemberRow | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("users")
    .select(
      `id, auth_user_id, name, email, phone, role, status, joined_at, last_active_at`,
    )
    .eq("auth_user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as unknown as Row;
  return {
    id: r.id,
    authUserId: r.auth_user_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    status: r.status,
    joinedAt: r.joined_at,
    lastActiveAt: r.last_active_at,
    isSelf: true,
  };
}
