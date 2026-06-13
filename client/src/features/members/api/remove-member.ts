import { createClient } from "@/lib/supabase/client";

export async function removeMember(memberId: string): Promise<string | null> {
  const supabase = createClient();
  const { data: row } = await supabase.from("member").select("email").eq("id", memberId).maybeSingle();
  const { error } = await supabase.from("member").delete().eq("id", memberId);
  if (error) throw error;
  return row?.email ?? null;
}
