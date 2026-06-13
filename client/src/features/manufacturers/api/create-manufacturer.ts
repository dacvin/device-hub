import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, type ManufacturerFormValues, mapManufacturerRow } from "@/lib/domain/devices";

export async function createManufacturer(v: ManufacturerFormValues): Promise<Manufacturer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .insert({
      name: v.name,
      support_contact: v.supportContact || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapManufacturerRow(data);
}
