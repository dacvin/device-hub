'use client';

import { useRef, useState } from 'react';

import { ImagePlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { entryKey } from '@/features/devices/components/use-device-media';
import { cn } from '@/lib/utils';
import type { DeviceMedia } from '@/features/devices/components/use-device-media';

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/webp';

// Mirrors DevicePhotosField's markup, scoped to the checkouts feature: this
// instance is always pending-only (no existing files, no signed-URL lookup,
// no reorder/cover controls needed for a fresh check-out/check-in dialog).
export function CheckoutPhotosField({ media }: { media: DeviceMedia }) {
  const t = useTranslations('checkouts');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const remaining = MAX_PHOTOS - media.entries.length;

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.size <= MAX_PHOTO_BYTES);
    if (files.length) media.add(files.slice(0, Math.max(0, remaining)));
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={remaining <= 0}
        onClick={() => remaining > 0 && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => {
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-6 text-center transition-colors',
          dragActive && 'border-primary bg-accent',
          remaining <= 0 && 'pointer-events-none opacity-50',
        )}
      >
        <ImagePlus className="text-muted-foreground size-5" />
        <span className="text-sm font-medium">{t('addPhotos')}</span>
        <span className="text-muted-foreground text-xs">{t('photosHint')}</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {media.entries.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {media.entries.map((e) => {
            const key = entryKey(e);
            const src = e.kind === 'pending' ? e.previewUrl : undefined;
            const label = e.kind === 'pending' ? e.file.name : e.descriptor.fileName;
            return (
              <li
                key={key}
                className="group bg-muted relative aspect-square overflow-hidden rounded-lg border"
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={label} className="size-full object-cover" />
                ) : null}

                <button
                  type="button"
                  aria-label={t('removeFile')}
                  onClick={() => {
                    media.remove(key);
                  }}
                  className="bg-background/80 text-foreground hover:bg-destructive hover:text-destructive-foreground absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full backdrop-blur transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
