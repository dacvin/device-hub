import { createClient } from "@/lib/supabase/client";

export interface UnitPayload {
  id?: string;
  name: string;
  description?: string;
  abbreviation?: string;
}

export async function saveUnit(input: UnitPayload): Promise<void> {
  if (!input.name.trim()) throw new Error("Name is required");
  const supabase = createClient();
  const row = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    abbreviation: input.abbreviation?.trim() || null,
  };
  const { error } = input.id
    ? await supabase.from("units").update(row).eq("id", input.id)
    : await supabase.from("units").insert(row);
  if (error) throw error;
}
