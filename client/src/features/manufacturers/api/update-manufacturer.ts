import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, type ManufacturerFormValues, mapManufacturerRow } from "@/lib/domain/devices";

export async function updateManufacturer(id: string, v: ManufacturerFormValues): Promise<Manufacturer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .update({
      name: v.name,
      support_contact: v.supportContact || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapManufacturerRow(data);
}
