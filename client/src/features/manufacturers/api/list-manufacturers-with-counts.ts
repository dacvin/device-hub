import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, mapManufacturerRow } from "@/lib/domain/devices";

export interface ManufacturerWithCount extends Manufacturer {
  deviceCount: number;
}

export async function listManufacturersWithCounts(): Promise<ManufacturerWithCount[]> {
  const supabase = createClient();
  const [{ data: rows, error }, { data: counts, error: countErr }] = await Promise.all([
    supabase.from("manufacturer").select("*").order("name", { ascending: true }),
    supabase.from("device").select("manufacturer_id").is("deleted_at", null),
  ]);
  if (error) throw error;
  if (countErr) throw countErr;
  const tally = new Map<string, number>();
  for (const c of counts ?? []) {
    if (c.manufacturer_id) tally.set(c.manufacturer_id, (tally.get(c.manufacturer_id) ?? 0) + 1);
  }
  return (rows ?? []).map((r) => ({
    ...mapManufacturerRow(r),
    deviceCount: tally.get(r.id) ?? 0,
  }));
}
