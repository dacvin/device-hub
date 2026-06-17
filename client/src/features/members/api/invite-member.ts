import { createClient } from "@/lib/supabase/client";
import type { MemberRole } from "../types";

export interface InviteInput {
  email: string;
  role: MemberRole;
  name?: string;
}

export async function inviteMember(input: InviteInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email is required");
  const supabase = createClient();
  const name = (input.name?.trim() || email.split("@")[0]).trim();
  const { error } = await supabase.from("users").insert({
    email,
    name,
    role: input.role,
    status: "invited",
  });
  if (error) throw error;
}
