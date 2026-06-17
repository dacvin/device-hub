import { createClient } from "@/lib/supabase/client";
import type { DeviceFormValues } from "@/lib/zod/device-form";
import {
  DEVICE_SELECT,
  mapDeviceRow,
  type Device,
} from "@/lib/domain/devices";

function emptyToNull(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = s.trim();
  return t === "" ? null : t;
}

export function formToInsertRow(values: DeviceFormValues) {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    group_id: values.groupId,
    unit_id: values.unitId,
    manufacturer_id: values.manufacturerId,
    model: emptyToNull(values.model),
    serial_number: emptyToNull(values.serialNumber),
    specifications: emptyToNull(values.specifications),
    notes: emptyToNull(values.notes),
    condition: values.condition,
    location: emptyToNull(values.location),
    quantity: values.quantity,
    source: values.source ? values.source : null,
    status: values.status,
    import_date: emptyToNull(values.importDate),
    last_check_date: emptyToNull(values.lastCheckDate),
    inventory_cycle_months: values.inventoryCycleMonths,
    warranty_start: emptyToNull(values.warrantyStart),
    warranty_end: emptyToNull(values.warrantyEnd),
  };
}

export async function createDevice(values: DeviceFormValues): Promise<Device> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("devices")
    .insert(formToInsertRow(values))
    .select(DEVICE_SELECT)
    .single();
  if (error) throw error;
  return mapDeviceRow(data);
}
