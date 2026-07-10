'use client';

import { useRef, useState } from 'react';

import { ChevronLeft, ChevronRight, ImagePlus, Star, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { PHOTOS_BUCKET, useSignedUrls } from '../api/device-media';
import { type DeviceMedia, entryKey } from './use-device-media';

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/webp';

export function DevicePhotosField({ media }: { media: DeviceMedia }) {
  const t = useTranslations('devices');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const existingPaths = media.entries
    .filter((e) => e.kind === 'existing')
    .map((e) => e.descriptor.path);
  const { data: signed } = useSignedUrls(PHOTOS_BUCKET, existingPaths);

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
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.entries.map((e, i) => {
            const key = entryKey(e);
            const src = e.kind === 'existing' ? signed?.[e.descriptor.path] : e.previewUrl;
            const label = e.kind === 'existing' ? e.descriptor.fileName : e.file.name;
            return (
              <li
                key={key}
                draggable
                onDragStart={() => (dragIndex.current = i)}
                onDragOver={(ev) => {
                  ev.preventDefault();
                }}
                onDrop={() => {
                  if (dragIndex.current !== null) media.move(dragIndex.current, i);
                  dragIndex.current = null;
                }}
                className="group bg-muted relative aspect-square overflow-hidden rounded-lg border"
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={label} className="size-full object-cover" />
                ) : (
                  <Skeleton className="size-full" />
                )}

                {i === 0 && (
                  <span className="bg-primary text-primary-foreground absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
                    <Star className="size-2.5 fill-current" />
                    {t('cover')}
                  </span>
                )}

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

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={t('moveLeft')}
                    disabled={i === 0}
                    onClick={() => {
                      media.move(i, i - 1);
                    }}
                    className="text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft />
                  </Button>
                  {i !== 0 && (
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        media.setCover(i);
                      }}
                      className="text-white hover:bg-white/20 hover:text-white"
                    >
                      {t('setCover')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={t('moveRight')}
                    disabled={i === media.entries.length - 1}
                    onClick={() => {
                      media.move(i, i + 1);
                    }}
                    className="text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
