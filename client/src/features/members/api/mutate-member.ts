import { createClient } from "@/lib/supabase/client";
import type { MemberRole, MemberStatus } from "../types";

export async function updateMemberRole(
  id: string,
  role: MemberRole,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("users").update({ role }).eq("id", id);
  if (error) throw error;
}

export async function setMemberStatus(
  id: string,
  status: MemberStatus,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("users").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function removeMember(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export interface OwnProfileInput {
  id: string;
  name: string;
  phone?: string;
}

export async function updateOwnProfile(input: OwnProfileInput): Promise<void> {
  if (!input.name.trim()) throw new Error("Name is required");
  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
    })
    .eq("id", input.id);
  if (error) throw error;
}
