"use client";

import { ImagePlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface PhotoItem {
  // Stable client id (uuid or "new-…")
  key: string;
  // DB id if persisted already
  dbId?: string;
  // Object path in the bucket (signed URL is loaded lazily)
  storagePath?: string;
  // URL to display: signed URL for persisted photos, blob URL for pending ones
  previewUrl: string;
  fileName: string | null;
  sizeBytes: number | null;
  // For pending uploads
  file?: File;
}

interface PhotoGalleryProps {
  items: PhotoItem[];
  onChange: (items: PhotoItem[]) => void;
  onRemovePersisted?: (item: PhotoItem) => Promise<void> | void;
}

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

export function PhotoGallery({ items, onChange, onRemovePersisted }: PhotoGalleryProps) {
  const t = useTranslations("devices.form");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const additions: PhotoItem[] = [];
      for (const f of Array.from(files)) {
        if (!ALLOWED.includes(f.type)) continue;
        if (f.size > MAX_SIZE) continue;
        additions.push({
          key: `new-${crypto.randomUUID()}`,
          previewUrl: URL.createObjectURL(f),
          fileName: f.name,
          sizeBytes: f.size,
          file: f,
        });
      }
      if (additions.length > 0) onChange([...items, ...additions]);
    },
    [items, onChange]
  );

  useEffect(() => {
    return () => {
      // Revoke blob URLs on unmount
      for (const it of items) {
        if (it.file) URL.revokeObjectURL(it.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(idx: number) {
    const item = items[idx];
    if (item.file) URL.revokeObjectURL(item.previewUrl);
    if (item.dbId && onRemovePersisted) await onRemovePersisted(item);
    onChange(items.filter((_, i) => i !== idx));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {items.map((item, idx) => (
          <div
            key={item.key}
            draggable
            onDragStart={() => setDragIndex(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) reorder(dragIndex, idx);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={cn(
              "group relative size-24 rounded-lg overflow-hidden border border-border bg-muted",
              dragIndex === idx && "opacity-50"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.previewUrl} alt={item.fileName ?? ""} className="size-full object-cover" />
            {idx === 0 && (
              <span className="absolute top-1 left-1 text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                {t("photoCover")}
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-1 right-1 size-5 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 flex items-center justify-center"
              aria-label={t("removePhoto")}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        <label
          className="size-24 rounded-lg border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors text-muted-foreground"
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <ImagePlus className="size-5" />
          <span className="text-[11px] mt-1">{t("addPhoto")}</span>
          <input
            type="file"
            accept={ALLOWED.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("photosHint")}
      </p>
    </div>
  );
}

export const ALLOWED_PHOTO_TYPES = ALLOWED;
export const MAX_PHOTO_SIZE = MAX_SIZE;
