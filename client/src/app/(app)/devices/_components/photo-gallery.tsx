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
      <div className="flex flex-wrap gap-3">
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
              "group relative size-24 cursor-grab overflow-hidden rounded-md border border-border bg-secondary active:cursor-grabbing",
              dragIndex === idx && "opacity-40"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.previewUrl} alt={item.fileName ?? ""} draggable={false} className="size-full object-cover" />
            {idx === 0 && (
              <span className="absolute inset-x-0 bottom-0 bg-primary text-primary-foreground text-center text-[10px] font-semibold py-0.5 tracking-wider">
                {t("photoCover")}
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-1 right-1 grid size-[22px] place-items-center rounded-full border-0 bg-foreground/55 text-background opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={t("removePhoto")}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        <label
          className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-[1.5px] border-dashed border-border bg-muted text-[11px] font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <ImagePlus className="size-5 text-primary" />
          <span>{t("addPhoto")}</span>
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
