import { useCallback, useEffect, useRef, useState } from 'react';

import type { DeviceFileDescriptor } from '../types/device';

export type MediaEntry =
  | { kind: 'existing'; descriptor: DeviceFileDescriptor }
  | { kind: 'pending'; id: string; file: File; previewUrl: string };

export function entryKey(e: MediaEntry): string {
  return e.kind === 'existing' ? e.descriptor.path : e.id;
}

export type DeviceMedia = ReturnType<typeof useDeviceMedia>;

export function useDeviceMedia(initial: DeviceFileDescriptor[], opts: { withPreview: boolean }) {
  const [entries, setEntries] = useState<MediaEntry[]>(() =>
    initial.map((descriptor) => ({ kind: 'existing', descriptor })),
  );

  // Track object URLs so we can revoke them on remove / unmount.
  const urls = useRef<Set<string>>(new Set());
  useEffect(
    () => () => {
      urls.current.forEach((u) => {
        URL.revokeObjectURL(u);
      });
    },
    [],
  );

  const add = useCallback(
    (files: File[]) => {
      setEntries((prev) => [
        ...prev,
        ...files.map((file) => {
          const previewUrl = opts.withPreview ? URL.createObjectURL(file) : '';
          if (previewUrl) urls.current.add(previewUrl);
          return { kind: 'pending' as const, id: crypto.randomUUID(), file, previewUrl };
        }),
      ]);
    },
    [opts.withPreview],
  );

  const remove = useCallback((key: string) => {
    setEntries((prev) => {
      const target = prev.find((e) => entryKey(e) === key);
      if (target?.kind === 'pending' && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        urls.current.delete(target.previewUrl);
      }
      return prev.filter((e) => entryKey(e) !== key);
    });
  }, []);

  const move = useCallback((from: number, to: number) => {
    setEntries((prev) => {
      if (to < 0 || to >= prev.length || from < 0 || from >= prev.length || from === to)
        return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const setCover = useCallback((index: number) => {
    setEntries((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.unshift(moved);
      return next;
    });
  }, []);

  const reset = useCallback((descriptors: DeviceFileDescriptor[]) => {
    setEntries(descriptors.map((descriptor) => ({ kind: 'existing', descriptor })));
  }, []);

  return { entries, add, remove, move, setCover, reset };
}
