import "server-only";
import { createClient } from "@/lib/supabase/server";

export const PHOTO_BUCKET = "device-photos";
export const DOCUMENT_BUCKET = "device-documents";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function signedPhotoUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function signedDocumentUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl ?? null;
}

// Batch signed URLs in one round-trip per bucket.
export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) return {};
  const out: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}

export async function signedDocumentUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) return {};
  const out: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}

export async function removePhotoObject(path: string): Promise<void> {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

export async function removeDocumentObject(path: string): Promise<void> {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
}
