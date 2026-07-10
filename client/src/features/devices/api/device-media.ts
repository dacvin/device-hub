import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

import { getDeviceQueryOptions } from './get-device';
import { getDevicesQueryOptions } from './get-paginated-devices';
import { fromDbDescriptors, toDbDescriptor } from './media-descriptor';

import type { MediaEntry } from '../components/use-device-media';
import type { DeviceFileDescriptor } from '../types/device';

export const PHOTOS_BUCKET = 'device-photos';
export const DOCUMENTS_BUCKET = 'device-documents';
export type MediaBucket = typeof PHOTOS_BUCKET | typeof DOCUMENTS_BUCKET;

function extFor(file: File): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : '';
  return (fromName || file.type.split('/')[1] || 'bin').toLowerCase();
}

export async function uploadDeviceFile(
  deviceId: string,
  bucket: MediaBucket,
  file: File,
  sortOrder: number,
): Promise<DeviceFileDescriptor> {
  const supabase = createClient();
  const path = `${deviceId}/${crypto.randomUUID()}.${extFor(file)}`;
  const { error } = await supabase.storage
    .from(bucket)
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

export async function removeDeviceFiles(bucket: MediaBucket, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}

// Private buckets → read via short-lived signed URLs. Keyed by sorted paths so
// the same set of files reuses one cache entry.
export function useSignedUrls(bucket: MediaBucket, paths: string[]) {
  return useQuery({
    queryKey: ['signed-urls', bucket, [...paths].sort()],
    queryFn: async (): Promise<Record<string, string>> => {
      if (paths.length === 0) return {};
      const supabase = createClient();
      const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const item of data) {
        if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
      }
      return map;
    },
    staleTime: 1000 * 60 * 50,
  });
}

async function commitOneBucket(
  deviceId: string,
  bucket: MediaBucket,
  entries: MediaEntry[],
  existing: DeviceFileDescriptor[],
): Promise<DeviceFileDescriptor[]> {
  const keptPaths = new Set(
    entries.filter((e) => e.kind === 'existing').map((e) => e.descriptor.path),
  );
  const removed = existing.filter((d) => !keptPaths.has(d.path)).map((d) => d.path);

  const descriptors: DeviceFileDescriptor[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.kind === 'existing') descriptors.push({ ...e.descriptor, sortOrder: i });
    else descriptors.push(await uploadDeviceFile(deviceId, bucket, e.file, i));
  }
  await removeDeviceFiles(bucket, removed);
  return descriptors;
}

export function useCommitDeviceMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      deviceId: string;
      photos: MediaEntry[];
      documents: MediaEntry[];
      existingPhotos: DeviceFileDescriptor[];
      existingDocuments: DeviceFileDescriptor[];
    }) => {
      const photos = await commitOneBucket(
        args.deviceId,
        PHOTOS_BUCKET,
        args.photos,
        args.existingPhotos,
      );
      const documents = await commitOneBucket(
        args.deviceId,
        DOCUMENTS_BUCKET,
        args.documents,
        args.existingDocuments,
      );
      const supabase = createClient();
      const { error } = await supabase
        .from('devices')
        .update({ photos: photos.map(toDbDescriptor), documents: documents.map(toDbDescriptor) })
        .eq('id', args.deviceId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      queryClient.invalidateQueries({
        queryKey: getDeviceQueryOptions(variables.deviceId).queryKey,
      });
    },
  });
}

export { fromDbDescriptors };
