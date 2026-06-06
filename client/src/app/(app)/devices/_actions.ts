"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { deviceFormSchema, type DeviceFormValues } from "@/lib/domain/devices";
import {
  createDevice,
  deleteDocumentRow,
  deletePhotoRow,
  insertDocumentRows,
  insertPhotoRows,
  setCoverPhoto,
  softDeleteDevice,
  updateDevice,
  updatePhotoOrder,
} from "@/lib/data/devices";
import { removeDocumentObject, removePhotoObject } from "@/lib/data/storage";

export interface ActionResult {
  ok: boolean;
  deviceId?: string;
  code?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parse(values: unknown): { ok: true; values: DeviceFormValues } | { ok: false; fieldErrors: Record<string, string> } {
  const parsed = deviceFormSchema.safeParse(values);
  if (parsed.success) return { ok: true, values: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    fieldErrors[issue.path.join(".")] = issue.message;
  }
  return { ok: false, fieldErrors };
}

export async function createDeviceAction(values: unknown): Promise<ActionResult> {
  const result = parse(values);
  if (!result.ok) return { ok: false, fieldErrors: result.fieldErrors };
  try {
    const device = await createDevice(result.values);
    revalidatePath("/devices");
    return { ok: true, deviceId: device.id, code: device.code };
  } catch (e) {
    return { ok: false, error: await errorMessage(e) };
  }
}

export async function updateDeviceAction(id: string, values: unknown): Promise<ActionResult> {
  const result = parse(values);
  if (!result.ok) return { ok: false, fieldErrors: result.fieldErrors };
  try {
    const device = await updateDevice(id, result.values);
    revalidatePath("/devices");
    revalidatePath(`/devices/${device.code}`);
    return { ok: true, deviceId: device.id, code: device.code };
  } catch (e) {
    return { ok: false, error: await errorMessage(e) };
  }
}

export async function deleteDeviceAction(id: string): Promise<void> {
  await softDeleteDevice(id);
  revalidatePath("/devices");
  redirect("/devices");
}

export async function insertPhotosAction(
  deviceId: string,
  photos: { url: string; fileName: string | null; sizeBytes: number | null; sortOrder: number }[]
) {
  const rows = await insertPhotoRows(deviceId, photos);
  return rows;
}

export async function reorderPhotosAction(rows: { id: string; sortOrder: number }[]) {
  await updatePhotoOrder(rows);
}

export async function removePhotoAction(photoId: string, storagePath: string) {
  await removePhotoObject(storagePath);
  await deletePhotoRow(photoId);
}

export async function setCoverPhotoAction(deviceId: string, photoId: string | null) {
  await setCoverPhoto(deviceId, photoId);
}

export async function insertDocumentsAction(
  deviceId: string,
  docs: { url: string; fileName: string; mimeType: string | null; sizeBytes: number | null }[]
) {
  return insertDocumentRows(deviceId, docs);
}

export async function removeDocumentAction(docId: string, storagePath: string) {
  await removeDocumentObject(storagePath);
  await deleteDocumentRow(docId);
}

async function errorMessage(e: unknown): Promise<string> {
  if (e instanceof Error) return e.message;
  const tCommon = await getTranslations("common");
  return tCommon("saveFailed");
}
