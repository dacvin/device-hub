import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  type Manufacturer,
  type ManufacturerFormValues,
  mapManufacturerRow,
} from "@/lib/domain/devices";

export interface ManufacturerWithCount extends Manufacturer {
  deviceCount: number;
}

export async function listManufacturers(): Promise<Manufacturer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapManufacturerRow);
}

export async function listManufacturersWithCounts(): Promise<ManufacturerWithCount[]> {
  const supabase = await createClient();
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

export async function getManufacturerById(id: string): Promise<Manufacturer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapManufacturerRow(data) : null;
}

export async function createManufacturer(v: ManufacturerFormValues): Promise<Manufacturer> {
  const supabase = await createClient();
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

export async function updateManufacturer(
  id: string,
  v: ManufacturerFormValues
): Promise<Manufacturer> {
  const supabase = await createClient();
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

export async function deleteManufacturer(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("manufacturer").delete().eq("id", id);
  if (error) throw error;
}
