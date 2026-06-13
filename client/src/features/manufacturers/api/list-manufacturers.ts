import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, mapManufacturerRow } from "@/lib/domain/devices";

export async function listManufacturers(): Promise<Manufacturer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapManufacturerRow);
}
