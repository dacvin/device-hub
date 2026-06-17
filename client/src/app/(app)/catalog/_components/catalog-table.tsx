"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import { GroupIconTile } from "@/features/overview/_components/group-icon-tile";
import { useDeleteCatalogRow } from "@/features/catalogs/hooks/use-delete-catalog-row";
import { CatalogInUseError } from "@/features/catalogs/api/delete-catalog-row";
import type { CatalogKind, CatalogRow } from "@/lib/domain/catalogs";
import { cn } from "@/lib/utils";

export type CatalogConfigColumn = {
  header: string;
  render: (row: CatalogRow) => React.ReactNode;
};

export interface CatalogConfig {
  kind: CatalogKind;
  singular: string;
  plural: string;
  /** Filter param name used when linking row → /devices?<filterKey>=<id>. */
  filterKey: "group" | "unit" | "mfr";
  /** Extra columns rendered between Name and Devices. */
  configColumns: CatalogConfigColumn[];
  showRowIcon?: boolean;
}

interface CatalogTableProps {
  config: CatalogConfig;
  rows: CatalogRow[];
  totalDevices: number;
  onCreate: () => void;
  onEdit: (row: CatalogRow) => void;
}

export function CatalogTable({
  config,
  rows,
  totalDevices,
  onCreate,
  onEdit,
}: CatalogTableProps) {
  const confirm = useConfirm();
  const deleteMutation = useDeleteCatalogRow();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const someChecked = selected.size > 0 && !allChecked;

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  }
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onRowDelete(row: CatalogRow) {
    if (row.deviceCount > 0) {
      toast.error(`Can't delete ${row.name}`, {
        description: `${row.deviceCount} ${row.deviceCount === 1 ? "device" : "devices"} still reference this ${config.singular.toLowerCase()}.`,
      });
      return;
    }
    const ok = await confirm({
      title: `Delete ${row.name}?`,
      description: `This ${config.singular.toLowerCase()} will be removed from the catalog.`,
      confirmLabel: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ kind: config.kind, id: row.id });
      toast.success(`${config.singular} deleted`);
    } catch (err) {
      const desc =
        err instanceof CatalogInUseError ? err.message :
        err instanceof Error ? err.message : String(err);
      toast.error("Delete failed", { description: desc });
    }
  }

  async function onBulkDelete() {
    const targets = filtered.filter(
      (r) => selected.has(r.id) && r.deviceCount === 0,
    );
    const blocked = filtered.filter(
      (r) => selected.has(r.id) && r.deviceCount > 0,
    );
    if (targets.length === 0) {
      toast.error("Can't delete", {
        description: `${blocked.length} ${config.plural.toLowerCase()} still have devices assigned.`,
      });
      return;
    }
    const ok = await confirm({
      title: `Delete ${targets.length} ${targets.length === 1 ? config.singular.toLowerCase() : config.plural.toLowerCase()}?`,
      description: blocked.length
        ? `${blocked.length} with active devices will be skipped.`
        : undefined,
      confirmLabel: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    let failed = 0;
    for (const row of targets) {
      try {
        await deleteMutation.mutateAsync({ kind: config.kind, id: row.id });
      } catch {
        failed++;
      }
    }
    if (failed) {
      toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    } else {
      toast.success(`Deleted ${targets.length} ${targets.length === 1 ? config.singular.toLowerCase() : config.plural.toLowerCase()}`);
    }
    setSelected(new Set());
  }

  function onBulkExport() {
    toast.success("Export started", {
      description: `Preparing a CSV of ${selected.size} ${config.plural.toLowerCase()}…`,
    });
    setSelected(new Set());
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 mb-4 max-[640px]:flex-col max-[640px]:items-stretch">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${config.plural.toLowerCase()}…`}
          className="h-9 w-[260px] max-[640px]:w-full rounded-md border border-input bg-card px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
        />
        <div className="text-[12.5px] text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">
            {rows.length}
          </span>{" "}
          {rows.length === 1 ? config.singular.toLowerCase() : config.plural.toLowerCase()} ·{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {totalDevices}
          </span>{" "}
          devices catalogued
        </div>
        <div className="ml-auto flex items-center gap-2 max-[640px]:ml-0 max-[640px]:w-full">
          <Button variant="outline" size="sm" className="h-9" type="button">
            <Download className="size-3.5" aria-hidden />
            Export
          </Button>
          <Button size="sm" className="h-9" onClick={onCreate}>
            <Plus className="size-3.5" aria-hidden />
            Create {config.singular.toLowerCase()}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-10 shadow-none">
          <p className="text-center text-[13px] text-muted-foreground">
            {query
              ? `No ${config.plural.toLowerCase()} match "${query}".`
              : `No ${config.plural.toLowerCase()} yet.`}
          </p>
        </Card>
      ) : (
        <Card className="shadow-none py-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[44px] pl-5">
                    <Checkbox
                      checked={someChecked ? "indeterminate" : allChecked}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  {config.configColumns.map((c) => (
                    <TableHead key={c.header}>{c.header}</TableHead>
                  ))}
                  <TableHead className="min-w-[200px]">Devices</TableHead>
                  <TableHead className="w-[80px] pr-5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const isSel = selected.has(r.id);
                  const pct = totalDevices > 0 ? Math.round((r.deviceCount / totalDevices) * 100) : 0;
                  return (
                    <TableRow
                      key={r.id}
                      className={cn("group/row", isSel && "bg-secondary/40")}
                    >
                      <TableCell className="pl-5">
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggleRow(r.id)}
                          aria-label={`Select ${r.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {config.showRowIcon ? (
                            <GroupIconTile
                              icon={r.icon ?? null}
                              groupName={r.name}
                            />
                          ) : null}
                          <span className="text-[13px] font-medium">{r.name}</span>
                        </div>
                      </TableCell>
                      {config.configColumns.map((c) => (
                        <TableCell key={c.header}>{c.render(r)}</TableCell>
                      ))}
                      <TableCell className="min-w-[200px]">
                        <Link
                          href={`/devices?${config.filterKey}=${r.id}`}
                          className="inline-flex items-center gap-2 group/link text-foreground hover:text-foreground"
                        >
                          <span className="block h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                            <span
                              className="block h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="text-[13px] font-semibold tabular-nums">
                            {r.deviceCount}
                          </span>
                          <span className="text-[11.5px] text-muted-foreground tabular-nums">
                            {pct}%
                          </span>
                          <ArrowRight className="size-3 text-muted-foreground group-hover/link:text-foreground transition-colors" aria-hidden />
                        </Link>
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => onEdit(r)}
                            className="size-8 rounded-md grid place-items-center hover:bg-muted text-muted-foreground"
                            aria-label={`Edit ${r.name}`}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            disabled={r.deviceCount > 0}
                            onClick={() => onRowDelete(r)}
                            title={
                              r.deviceCount > 0
                                ? `Can't delete — ${r.deviceCount} devices assigned`
                                : undefined
                            }
                            className="size-8 rounded-md grid place-items-center hover:bg-muted text-muted-foreground hover:text-destructive disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:cursor-not-allowed"
                            aria-label={`Delete ${r.name}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {selected.size > 0 ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-card text-card-foreground ring-1 ring-foreground/10 shadow-lg px-3 py-2">
          <span className="text-[12.5px] font-medium px-2 tabular-nums">
            {selected.size} selected
          </span>
          <span className="h-5 w-px bg-border" aria-hidden />
          <Button variant="ghost" size="sm" onClick={onBulkExport}>
            <Download className="size-3.5" aria-hidden />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete
          </Button>
        </div>
      ) : null}
    </>
  );
}
