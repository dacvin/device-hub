'use client';

import { useState } from 'react';

import { Download, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { DOCUMENTS_BUCKET, PHOTOS_BUCKET, useSignedUrls } from '../api/device-media';

import type { DeviceFileDescriptor } from '../types/device';

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DeviceMediaView({
  photos,
  documents,
}: {
  photos: DeviceFileDescriptor[];
  documents: DeviceFileDescriptor[];
}) {
  const t = useTranslations('devices');
  const { data: photoUrls } = useSignedUrls(
    PHOTOS_BUCKET,
    photos.map((p) => p.path),
  );
  const { data: docUrls } = useSignedUrls(
    DOCUMENTS_BUCKET,
    documents.map((d) => d.path),
  );
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t('photosLabel')}
        </h4>
        {photos.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noPhotos')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p) => {
              const url = photoUrls?.[p.path];
              return (
                <button
                  key={p.path}
                  type="button"
                  disabled={!url}
                  onClick={() => {
                    if (url) setLightbox({ url, name: p.fileName });
                  }}
                  className="group bg-muted focus-visible:ring-ring relative aspect-square overflow-hidden rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
                >
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={p.fileName}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <Skeleton className="size-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t('documentsLabel')}
        </h4>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noDocuments')}</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border">
            {documents.map((d) => {
              const url = docUrls?.[d.path];
              return (
                <li key={d.path} className="flex items-center gap-3 px-3 py-2.5">
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.fileName}</p>
                    <p className="text-muted-foreground font-mono text-xs tracking-[-0.01em] tabular-nums">
                      {humanSize(d.sizeBytes)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!url}
                    onClick={() => {
                      if (url) window.open(url, '_blank', 'noopener');
                    }}
                  >
                    <Download />
                    {t('download')}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog
        open={lightbox !== null}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{lightbox?.name}</DialogTitle>
          </DialogHeader>
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightbox.url} alt={lightbox.name} className="h-auto w-full rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
