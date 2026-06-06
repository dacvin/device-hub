"use client";

import { File, FileImage, FileSpreadsheet, FileText, Upload, X, type LucideIcon } from "lucide-react";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { fileTypeIcon, formatBytes } from "@/lib/domain/devices";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "file-text": FileText,
  "file-spreadsheet": FileSpreadsheet,
  "file-image": FileImage,
  file: File,
};

export interface DocumentItem {
  key: string;
  dbId?: string;
  storagePath?: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  file?: File;
}

interface DocumentListProps {
  items: DocumentItem[];
  onChange: (items: DocumentItem[]) => void;
  onRemovePersisted?: (item: DocumentItem) => Promise<void> | void;
}

export function DocumentList({ items, onChange, onRemovePersisted }: DocumentListProps) {
  const t = useTranslations("devices.form");
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const additions: DocumentItem[] = [];
      for (const f of Array.from(files)) {
        additions.push({
          key: `new-${crypto.randomUUID()}`,
          fileName: f.name,
          mimeType: f.type || null,
          sizeBytes: f.size,
          file: f,
        });
      }
      if (additions.length > 0) onChange([...items, ...additions]);
    },
    [items, onChange]
  );

  async function remove(idx: number) {
    const item = items[idx];
    if (item.dbId && onRemovePersisted) await onRemovePersisted(item);
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-[3px] rounded-lg border-[1.5px] border-dashed border-border",
          "bg-muted text-center px-[18px] py-[26px] transition-colors hover:border-ring"
        )}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="mb-2 grid size-10 place-items-center rounded-[11px] border border-border bg-card text-primary">
          <Upload className="size-[19px]" />
        </div>
        <div className="text-sm font-medium">{t("uploadDocuments")}</div>
        <div className="text-xs text-muted-foreground">
          {t("documentsHint")}
        </div>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((it, idx) => {
            const Icon = ICONS[fileTypeIcon(it.fileName)] ?? File;
            return (
              <li
                key={it.key}
                className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-[9px]"
              >
                <div className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon className="size-[17px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{it.fileName}</div>
                  <div className="text-xs text-muted-foreground">{formatBytes(it.sizeBytes)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="grid size-[30px] place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  aria-label={t("removeDocument")}
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
