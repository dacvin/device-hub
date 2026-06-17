import { createClient } from "@/lib/supabase/client";
import type { SimpleLookup } from "@/lib/domain/catalogs";

export async function listGroupsSimple(): Promise<SimpleLookup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listUnitsSimple(): Promise<SimpleLookup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("units")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listManufacturersSimple(): Promise<SimpleLookup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manufacturers")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}
