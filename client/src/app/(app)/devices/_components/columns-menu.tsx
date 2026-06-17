"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ColumnKey =
  | "photo"
  | "code"
  | "name"
  | "group"
  | "mfr"
  | "cond"
  | "loc"
  | "status"
  | "flags"
  | "qty";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  locked?: boolean;
  defaultHidden?: boolean;
}

export const COLUMN_REGISTRY: ColumnDef[] = [
  { key: "photo", label: "Type icon" },
  { key: "code", label: "Code" },
  { key: "name", label: "Name", locked: true },
  { key: "group", label: "Group" },
  { key: "mfr", label: "Manufacturer / Model", defaultHidden: true },
  { key: "cond", label: "Condition" },
  { key: "loc", label: "Location", defaultHidden: true },
  { key: "status", label: "Status" },
  { key: "flags", label: "Flags" },
  { key: "qty", label: "Qty" },
];

export const DEFAULT_HIDDEN: Set<ColumnKey> = new Set(
  COLUMN_REGISTRY.filter((c) => c.defaultHidden).map((c) => c.key),
);

interface ColumnsMenuProps {
  hidden: Set<ColumnKey>;
  onChange: (next: Set<ColumnKey>) => void;
}

export function ColumnsMenu({ hidden, onChange }: ColumnsMenuProps) {
  function toggle(key: ColumnKey, locked: boolean | undefined) {
    if (locked) return;
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <SlidersHorizontal className="size-3.5" aria-hidden />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COLUMN_REGISTRY.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={!hidden.has(col.key)}
            disabled={col.locked}
            onCheckedChange={() => toggle(col.key, col.locked)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="flex-1">{col.label}</span>
            {col.locked ? (
              <span className="text-[11px] text-muted-foreground">
                Required
              </span>
            ) : null}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
