import { createClient } from "@/lib/supabase/client";
import type { MemberRole } from "@/lib/domain/members";

export async function updateMemberRole(memberId: string, role: MemberRole): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("member").update({ role }).eq("id", memberId);
  if (error) throw error;
}
