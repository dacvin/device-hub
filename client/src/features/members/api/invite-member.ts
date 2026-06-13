import { createClient } from "@/lib/supabase/client";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/domain/members";

export async function inviteMember(input: InviteMemberInput, invitedBy: string): Promise<string> {
  const parsed = inviteMemberSchema.parse(input);
  const supabase = createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("member").insert({
    id,
    name: parsed.name,
    email: parsed.email,
    role: parsed.role,
    status: "invited",
    department_id: parsed.departmentId,
    invited_by: invitedBy,
  });
  if (error) throw error;
  return id;
}
