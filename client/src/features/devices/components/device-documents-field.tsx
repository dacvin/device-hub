'use client';

import { useRef, useState } from 'react';

import { FilePlus, FileText, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { humanSize } from './device-media-view';
import { type DeviceMedia, entryKey } from './use-device-media';

const MAX_DOCS = 10;
const MAX_DOC_BYTES = 20 * 1024 * 1024;

export function DeviceDocumentsField({ media }: { media: DeviceMedia }) {
  const t = useTranslations('devices');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const remaining = MAX_DOCS - media.entries.length;

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.size <= MAX_DOC_BYTES);
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
        <FilePlus className="text-muted-foreground size-5" />
        <span className="text-sm font-medium">{t('addDocuments')}</span>
        <span className="text-muted-foreground text-xs">{t('documentsHint')}</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {media.entries.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {media.entries.map((e) => {
            const key = entryKey(e);
            const name = e.kind === 'existing' ? e.descriptor.fileName : e.file.name;
            const size = e.kind === 'existing' ? e.descriptor.sizeBytes : e.file.size;
            return (
              <li key={key} className="flex items-center gap-3 px-3 py-2.5">
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="text-muted-foreground font-mono text-xs tracking-[-0.01em] tabular-nums">
                    {humanSize(size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('removeFile')}
                  onClick={() => {
                    media.remove(key);
                  }}
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
