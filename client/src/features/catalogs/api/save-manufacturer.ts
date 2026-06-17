import { createClient } from "@/lib/supabase/client";

export interface ManufacturerPayload {
  id?: string;
  name: string;
  supportContact?: string;
}

export async function saveManufacturer(input: ManufacturerPayload): Promise<void> {
  if (!input.name.trim()) throw new Error("Name is required");
  const supabase = createClient();
  const row = {
    name: input.name.trim(),
    support_contact: input.supportContact?.trim() || null,
  };
  const { error } = input.id
    ? await supabase.from("manufacturers").update(row).eq("id", input.id)
    : await supabase.from("manufacturers").insert(row);
  if (error) throw error;
}
