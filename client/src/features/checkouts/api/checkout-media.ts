import { createClient } from '@/lib/supabase/client';
import type { MediaEntry } from '@/features/devices/components/use-device-media';

import { CHECKOUT_PHOTOS_BUCKET } from '../constants/checkout';

import type { CheckoutFileDescriptor } from '../types/checkout';

function extFor(file: File): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : '';
  return (fromName || file.type.split('/')[1] || 'bin').toLowerCase();
}

export async function uploadCheckoutPhoto(
  prefix: string,
  file: File,
  sortOrder: number,
): Promise<CheckoutFileDescriptor> {
  const supabase = createClient();
  const path = `${prefix}/${crypto.randomUUID()}.${extFor(file)}`;
  const { error } = await supabase.storage
    .from(CHECKOUT_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return {
    path,
    fileName: file.name,
    sizeBytes: file.size,
    mimeType: file.type,
    sortOrder,
    uploadedAt: new Date().toISOString(),
  };
}

// Upload all pending entries under `prefix`; return descriptors in order.
export async function commitCheckoutPhotos(
  prefix: string,
  entries: MediaEntry[],
): Promise<CheckoutFileDescriptor[]> {
  const out: CheckoutFileDescriptor[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.kind === 'existing') out.push({ ...e.descriptor, sortOrder: i });
    else out.push(await uploadCheckoutPhoto(prefix, e.file, i));
  }
  return out;
}
