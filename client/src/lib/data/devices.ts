import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getOrgSettings } from "@/lib/data/settings";
import { escapePostgrestFilter } from "@/lib/data/_filter";
import {
  type DeviceFlag,
  type DeviceFormValues,
  type DeviceStatus,
  type DeviceWithFlags,
  type Device,
  type DevicePhoto,
  type DeviceDocument,
  deviceFormToInsert,
  mapDeviceRow,
  mapDeviceWithFlagsRow,
  mapPhotoRow,
  mapDocumentRow,
} from "@/lib/domain/devices";
import type { Database } from "@/types/database.types";

export interface DeviceListFilters {
  q?: string;
  group?: string;
  dept?: string;
  status?: string;
  mfr?: string;
  flag?: DeviceFlag | string;
}

export async function listDevices(filters: DeviceListFilters = {}): Promise<DeviceWithFlags[]> {
  const supabase = await createClient();
  const settings = await getOrgSettings();
  let q = supabase
    .rpc("devices_with_flags", { p_warranty_days: settings.warrantyExpiringDays })
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (filters.group) q = q.eq("group_id", filters.group);
  if (filters.dept) q = q.eq("department_id", filters.dept);
  if (filters.status) q = q.eq("status", filters.status as "in-use" | "in-storage" | "in-repair" | "retired");
  if (filters.mfr) q = q.eq("manufacturer_id", filters.mfr);
  if (filters.flag === "warranty-expiring") q = q.eq("flag_warranty_expiring", true);
  if (filters.flag === "inventory-overdue") q = q.eq("flag_inventory_overdue", true);
  if (filters.q) {
    const term = filters.q.trim();
    if (term) {
      const safe = escapePostgrestFilter(term);
      q = q.or(
        `name.ilike.%${safe}%,code.ilike.%${safe}%,serial_number.ilike.%${safe}%,model.ilike.%${safe}%`
      );
    }
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapDeviceWithFlagsRow);
}

export async function getDeviceWithFlagsByCode(code: string): Promise<DeviceWithFlags | null> {
  const supabase = await createClient();
  const settings = await getOrgSettings();
  const { data, error } = await supabase
    .rpc("devices_with_flags", { p_warranty_days: settings.warrantyExpiringDays })
    .select("*")
    .eq("code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDeviceWithFlagsRow(data) : null;
}

export async function getDeviceById(id: string): Promise<Device | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDeviceRow(data) : null;
}

export async function listDevicePhotos(deviceId: string): Promise<DevicePhoto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_photo")
    .select("*")
    .eq("device_id", deviceId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPhotoRow);
}

export async function listDeviceDocuments(deviceId: string): Promise<DeviceDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_document")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDocumentRow);
}

export async function createDevice(values: DeviceFormValues): Promise<Device> {
  const supabase = await createClient();
  const insert = deviceFormToInsert(values);
  const { data, error } = await supabase
    .from("device")
    .insert(insert)
    .select("*")
    .single();
  if (error) throw error;
  return mapDeviceRow(data);
}

export async function updateDevice(id: string, values: DeviceFormValues): Promise<Device> {
  const supabase = await createClient();
  const update: Database["public"]["Tables"]["device"]["Update"] = deviceFormToInsert(values);
  const { data, error } = await supabase
    .from("device")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDeviceRow(data);
}

export async function softDeleteDevice(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("device")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function bulkUpdateDeviceStatus(ids: string[], status: DeviceStatus): Promise<void> {
  if (ids.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("device")
    .update({ status })
    .in("id", ids);
  if (error) throw error;
}

export async function bulkSoftDeleteDevices(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("device")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

export async function insertPhotoRows(
  deviceId: string,
  photos: { url: string; fileName: string | null; sizeBytes: number | null; sortOrder: number }[]
): Promise<DevicePhoto[]> {
  if (photos.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_photo")
    .insert(
      photos.map((p) => ({
        device_id: deviceId,
        url: p.url,
        file_name: p.fileName,
        size_bytes: p.sizeBytes,
        sort_order: p.sortOrder,
      }))
    )
    .select("*");
  if (error) throw error;
  return (data ?? []).map(mapPhotoRow);
}

export async function updatePhotoOrder(
  rows: { id: string; sortOrder: number }[]
): Promise<void> {
  if (rows.length === 0) return;
  const supabase = await createClient();
  for (const r of rows) {
    const { error } = await supabase
      .from("device_photo")
      .update({ sort_order: r.sortOrder })
      .eq("id", r.id);
    if (error) throw error;
  }
}

export async function deletePhotoRow(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("device_photo").delete().eq("id", id);
  if (error) throw error;
}

export async function insertDocumentRows(
  deviceId: string,
  docs: { url: string; fileName: string; mimeType: string | null; sizeBytes: number | null }[]
): Promise<DeviceDocument[]> {
  if (docs.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device_document")
    .insert(
      docs.map((d) => ({
        device_id: deviceId,
        url: d.url,
        file_name: d.fileName,
        mime_type: d.mimeType,
        size_bytes: d.sizeBytes,
      }))
    )
    .select("*");
  if (error) throw error;
  return (data ?? []).map(mapDocumentRow);
}

export async function deleteDocumentRow(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("device_document").delete().eq("id", id);
  if (error) throw error;
}

export async function setCoverPhoto(deviceId: string, photoId: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("device")
    .update({ cover_photo_id: photoId })
    .eq("id", deviceId);
  if (error) throw error;
}
