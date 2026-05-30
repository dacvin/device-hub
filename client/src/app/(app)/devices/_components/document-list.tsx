"use client";

import { File, FileImage, FileSpreadsheet, FileText, Upload, X, type LucideIcon } from "lucide-react";
import { useCallback } from "react";
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
    <div className="space-y-3">
      <label
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border",
          "bg-muted/40 px-4 py-8 cursor-pointer hover:bg-accent transition-colors text-center"
        )}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Upload className="size-4" />
        </div>
        <div className="text-sm font-medium">Upload documents</div>
        <div className="text-xs text-muted-foreground">
          Invoices, warranty cards, manuals · PDF, DOCX, XLSX, images
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
        <ul className="space-y-2">
          {items.map((it, idx) => {
            const Icon = ICONS[fileTypeIcon(it.fileName)] ?? File;
            return (
              <li
                key={it.key}
                className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
              >
                <div className="size-9 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{it.fileName}</div>
                  <div className="text-xs text-muted-foreground">{formatBytes(it.sizeBytes)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="size-6 rounded-md text-muted-foreground hover:bg-accent flex items-center justify-center"
                  aria-label="Remove document"
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
