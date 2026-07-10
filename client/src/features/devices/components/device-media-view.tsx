'use client';

import Image from 'next/image';
import { useState } from 'react';

import { Download, ExternalLink, FileText, ImageOff, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { DOCUMENTS_BUCKET, PHOTOS_BUCKET, useSignedUrls } from '../api/device-media';

import type { DeviceFileDescriptor } from '../types/device';

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : '';
}

function Count({ n }: { n: number }) {
  return (
    <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums">
      {n}
    </span>
  );
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
        <h4 className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
          {t('photosLabel')}
          <Count n={photos.length} />
        </h4>
        {photos.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm">
            <ImageOff className="size-5 opacity-60" />
            {t('noPhotos')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                  className="group bg-muted focus-visible:ring-ring relative aspect-square overflow-hidden rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
                >
                  {url ? (
                    <>
                      <Image
                        src={url}
                        alt={p.fileName}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                        <Maximize2 className="size-5 text-white drop-shadow" />
                      </span>
                    </>
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
        <h4 className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
          {t('documentsLabel')}
          <Count n={documents.length} />
        </h4>
        {documents.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm">
            <FileText className="size-5 opacity-60" />
            {t('noDocuments')}
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {documents.map((d) => {
              const url = docUrls?.[d.path];
              const ext = fileExt(d.fileName);
              return (
                <li
                  key={d.path}
                  className="hover:border-primary/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
                >
                  <span className="bg-accent text-primary relative flex size-9 shrink-0 items-center justify-center rounded-md">
                    <FileText className="size-4" />
                    {ext && (
                      <span className="bg-primary text-primary-foreground absolute -bottom-1 rounded px-1 font-mono text-[9px] leading-tight tabular-nums">
                        {ext}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.fileName}</p>
                    <p className="text-muted-foreground font-mono text-xs tracking-[-0.01em] tabular-nums">
                      {humanSize(d.sizeBytes)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('download')}
                    disabled={!url}
                    onClick={() => {
                      if (url) window.open(url, '_blank', 'noopener');
                    }}
                  >
                    <ExternalLink />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('download')}
                    disabled={!url}
                    asChild={!!url}
                  >
                    {url ? (
                      <a href={url} download={d.fileName}>
                        <Download />
                      </a>
                    ) : (
                      <Download />
                    )}
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
        <DialogContent className={cn('max-w-3xl')}>
          <DialogHeader>
            <DialogTitle className="truncate">{lightbox?.name}</DialogTitle>
          </DialogHeader>
          {lightbox && (
            <Image
              src={lightbox.url}
              alt={lightbox.name}
              width={0}
              height={0}
              unoptimized
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
