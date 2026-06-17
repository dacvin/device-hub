import { createClient } from "@/lib/supabase/client";

export interface GroupPayload {
  id?: string;
  name: string;
  icon?: string | null;
  cycle: number;
}

export async function saveGroup(input: GroupPayload): Promise<void> {
  if (!input.name.trim()) throw new Error("Name is required");
  const supabase = createClient();
  const row = {
    name: input.name.trim(),
    icon: input.icon || null,
    default_inventory_cycle_months: input.cycle,
  };
  const { error } = input.id
    ? await supabase.from("groups").update(row).eq("id", input.id)
    : await supabase.from("groups").insert(row);
  if (error) throw error;
}
