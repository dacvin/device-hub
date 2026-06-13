import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, mapManufacturerRow } from "@/lib/domain/devices";

export async function getManufacturerById(id: string): Promise<Manufacturer | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapManufacturerRow(data) : null;
}
