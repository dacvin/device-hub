"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Download, HardDrive, Pencil, Plus, SearchX, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/app/status-badge";
import { ConditionBar } from "@/components/app/condition-bar";
import { FlagChipsRow } from "@/components/app/flag-chip";
import { GroupIconTile } from "@/features/overview/_components/group-icon-tile";
import { useConfirm } from "@/hooks/use-confirm";
import {
  useBulkDeleteDevices,
  useDeleteDevice,
} from "@/features/devices/hooks/use-delete-device";
import { cn } from "@/lib/utils";
import type {
  DeviceFlag,
  DeviceStatus,
  Device,
} from "@/lib/domain/devices";
import {
  COLUMN_REGISTRY,
  DEFAULT_HIDDEN,
  type ColumnKey,
} from "./columns-menu";
import { DeviceToolbar } from "./device-toolbar";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { DeviceListSkeleton } from "./device-list-skeleton";

const HIDDEN_LS_KEY = "dh-cols-hidden";

export function DeviceListClient() {
  const router = useRouter();
  const params = useSearchParams();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const q = params.get("q") ?? "";
  const groupId = params.get("group") ?? "";
  const statusRaw = params.get("status") ?? "";
  const status: DeviceStatus | "" =
    statusRaw === "in-use" ||
    statusRaw === "storage" ||
    statusRaw === "repair" ||
    statusRaw === "retired"
      ? statusRaw
      : "";
  const manufacturerId = params.get("mfr") ?? "";
  const flagRaw = params.get("flag") ?? "";
  const flag: DeviceFlag | "" =
    flagRaw === "warranty" || flagRaw === "inventory" ? flagRaw : "";
  const view: "table" | "cards" = params.get("view") === "cards" ? "cards" : "table";

  const { data, isPending, error } = useDevices({
    q,
    groupId,
    status,
    manufacturerId,
    flag,
  });

  const deleteDevice = useDeleteDevice();
  const bulkDelete = useBulkDeleteDevices();

  const [hidden, setHidden] = useState<Set<ColumnKey>>(DEFAULT_HIDDEN);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ColumnKey[];
        setHidden(new Set(parsed));
      }
    } catch {
      // ignore
    }
  }, []);
  function persistHidden(next: Set<ColumnKey>) {
    setHidden(next);
    try {
      localStorage.setItem(HIDDEN_LS_KEY, JSON.stringify([...next]));
    } catch {
      // ignore
    }
  }

  const visibleColumns = useMemo(
    () => COLUMN_REGISTRY.filter((c) => !hidden.has(c.key)).map((c) => c.key),
    [hidden],
  );

  const rows = data?.rows ?? [];
  useEffect(() => {
    const ids = new Set(rows.map((r) => r.id));
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) if (ids.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  function changeView(next: "table" | "cards") {
    const sp = new URLSearchParams(params.toString());
    if (next === "table") sp.delete("view");
    else sp.set("view", next);
    const s = sp.toString();
    startTransition(() =>
      router.replace(`/devices${s ? `?${s}` : ""}`, { scroll: false }),
    );
  }

  async function onRowDelete(row: Device) {
    const ok = await confirm({
      title: `Delete ${row.name}?`,
      description: "This moves it to the recycle bin. You can restore it later.",
      confirmLabel: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await deleteDevice.mutateAsync(row.id);
      toast.success("Device deleted", {
        description: "Moved to the recycle bin.",
      });
    } catch (err) {
      toast.error("Delete failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function onBulkDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;
    const ok = await confirm({
      title: `Delete ${ids.length} ${ids.length === 1 ? "device" : "devices"}?`,
      description: "These move to the recycle bin. You can restore them later.",
      confirmLabel: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      const count = await bulkDelete.mutateAsync(ids);
      toast.success(
        `Deleted ${count} ${count === 1 ? "device" : "devices"}`,
        { description: "Moved to the recycle bin." },
      );
      setSelected(new Set());
    } catch (err) {
      toast.error("Delete failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function onBulkExport() {
    toast.success("Export started", {
      description: `Preparing a CSV of ${selected.size} devices…`,
    });
    setSelected(new Set());
  }

  if (isPending) {
    return (
      <>
        <DeviceToolbar hiddenColumns={hidden} onHiddenColumnsChange={persistHidden} />
        <DeviceListSkeleton />
      </>
    );
  }

  if (error || !data) {
    return (
      <Card className="py-10 shadow-none mt-4">
        <p className="text-center text-[13px] text-destructive">
          Failed to load devices. {error?.message}
        </p>
      </Card>
    );
  }

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const someChecked = selected.size > 0 && selected.size < rows.length;

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasFilters = !!(q || groupId || status || manufacturerId || flag);

  return (
    <>
      <DeviceToolbar hiddenColumns={hidden} onHiddenColumnsChange={persistHidden} />

      <div className="flex items-center justify-between mt-3.5">
        <div className="text-[12.5px] text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">
            {data.filteredCount}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {data.totalCount}
          </span>{" "}
          devices
        </div>
        <Tabs value={view} onValueChange={(v) => changeView(v as "table" | "cards")}>
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 pb-32">
        {rows.length === 0 ? (
          <EmptyState kind={hasFilters ? "filtered" : "empty"} />
        ) : view === "cards" ? (
          <CardsGrid rows={rows} />
        ) : (
          <Card className="shadow-none py-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[880px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[44px] pl-5">
                      <Checkbox
                        checked={someChecked ? "indeterminate" : allChecked}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    {visibleColumns.includes("photo") ? (
                      <TableHead className="w-[44px]"></TableHead>
                    ) : null}
                    {visibleColumns.includes("code") ? (
                      <TableHead>Code</TableHead>
                    ) : null}
                    <TableHead>Name</TableHead>
                    {visibleColumns.includes("group") ? (
                      <TableHead>Group</TableHead>
                    ) : null}
                    {visibleColumns.includes("mfr") ? (
                      <TableHead>Manufacturer / Model</TableHead>
                    ) : null}
                    {visibleColumns.includes("cond") ? (
                      <TableHead className="min-w-[140px]">Condition</TableHead>
                    ) : null}
                    {visibleColumns.includes("loc") ? (
                      <TableHead>Location</TableHead>
                    ) : null}
                    {visibleColumns.includes("status") ? (
                      <TableHead>Status</TableHead>
                    ) : null}
                    {visibleColumns.includes("flags") ? (
                      <TableHead>Flags</TableHead>
                    ) : null}
                    {visibleColumns.includes("qty") ? (
                      <TableHead className="text-right pr-3">Qty</TableHead>
                    ) : null}
                    <TableHead className="w-[80px] pr-5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const isSel = selected.has(r.id);
                    return (
                      <TableRow
                        key={r.id}
                        className={cn(
                          "group/row",
                          isSel && "bg-secondary/40",
                        )}
                      >
                        <TableCell className="pl-5">
                          <Checkbox
                            checked={isSel}
                            onCheckedChange={() => toggleRow(r.id)}
                            aria-label={`Select ${r.name}`}
                          />
                        </TableCell>
                        {visibleColumns.includes("photo") ? (
                          <TableCell>
                            <GroupIconTile
                              icon={r.groupIcon}
                              groupName={r.groupName}
                            />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("code") ? (
                          <TableCell className="font-mono text-[12.5px] text-muted-foreground whitespace-nowrap">
                            {r.code}
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <Link
                            href={`/devices/${r.code}`}
                            className="text-[13px] font-medium text-foreground hover:underline"
                          >
                            {r.name}
                          </Link>
                        </TableCell>
                        {visibleColumns.includes("group") ? (
                          <TableCell>
                            <Badge variant="secondary" className="font-medium">
                              {r.groupName}
                            </Badge>
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("mfr") ? (
                          <TableCell>
                            <div className="text-[13px]">
                              {r.manufacturerName ?? "—"}
                            </div>
                            {r.model ? (
                              <div className="text-[12px] text-muted-foreground truncate max-w-[180px]">
                                {r.model}
                              </div>
                            ) : null}
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("cond") ? (
                          <TableCell>
                            <ConditionBar condition={r.condition} />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("loc") ? (
                          <TableCell className="text-[12.5px] text-muted-foreground max-w-[200px] truncate">
                            {r.location ?? "—"}
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("status") ? (
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("flags") ? (
                          <TableCell>
                            <FlagChipsRow flags={r.flags} />
                          </TableCell>
                        ) : null}
                        {visibleColumns.includes("qty") ? (
                          <TableCell className="text-right pr-3 tabular-nums text-[13px]">
                            {r.quantity}
                          </TableCell>
                        ) : null}
                        <TableCell className="pr-5">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <Link
                              href={`/devices/${r.code}/edit`}
                              className="size-8 rounded-md grid place-items-center hover:bg-muted text-muted-foreground"
                              aria-label={`Edit ${r.name}`}
                            >
                              <Pencil className="size-4" aria-hidden />
                            </Link>
                            <button
                              type="button"
                              onClick={() => onRowDelete(r)}
                              className="size-8 rounded-md grid place-items-center hover:bg-muted text-muted-foreground hover:text-destructive"
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
      </div>

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
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="size-7 rounded-full grid place-items-center hover:bg-muted text-muted-foreground"
            aria-label="Clear selection"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}
    </>
  );
}

function CardsGrid({ rows }: { rows: Device[] }) {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {rows.map((r) => {
        const cover = r.photos[0];
        return (
          <Link
            key={r.id}
            href={`/devices/${r.code}`}
            className="block group/card"
          >
            <Card className="shadow-none py-0 overflow-hidden h-full transition-colors hover:ring-foreground/20">
              <div className="relative aspect-[16/10] bg-gradient-to-br from-secondary to-muted grid place-items-center">
                {cover ? (
                  <Image
                    src={`/device-photos/${cover.path}`}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <GroupIconTile
                    icon={r.groupIcon}
                    groupName={r.groupName}
                    size="md"
                    className="size-12 [&_svg]:size-6"
                  />
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.01em]">
                    {r.name}
                  </div>
                  <div className="font-mono text-[12px] text-muted-foreground">
                    {r.code}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                  <MetaRow label="Manufacturer" value={r.manufacturerName ?? "—"} />
                  <MetaRow label="Group" value={r.groupName} />
                  <MetaRow label="Model" value={r.model ?? "—"} full />
                  <MetaRow label="Location" value={r.location ?? "—"} full />
                </div>
                {r.flags.length > 0 ? <FlagChipsRow flags={r.flags} /> : null}
                <div className="flex items-center justify-between pt-1">
                  <ConditionBar condition={r.condition} />
                  <div className="text-[12.5px] text-muted-foreground">
                    Qty <span className="font-semibold text-foreground tabular-nums">{r.quantity}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function MetaRow({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={cn(full && "col-span-2", "min-w-0")}>
      <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="text-[13px] truncate">{value}</div>
    </div>
  );
}

function EmptyState({ kind }: { kind: "empty" | "filtered" }) {
  const router = useRouter();
  if (kind === "filtered") {
    return (
      <Card className="py-10 shadow-none">
        <div className="flex flex-col items-center text-center px-5">
          <span className="size-12 rounded-xl bg-secondary text-secondary-foreground grid place-items-center mb-4">
            <SearchX className="size-5" aria-hidden />
          </span>
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
            No devices match these filters
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
            Try clearing one of the active filters, or register a new device.
          </p>
          <div className="flex items-center gap-2 mt-5">
            <Button variant="outline" onClick={() => router.replace("/devices")}>
              Clear filters
            </Button>
            <Button asChild>
              <Link href="/devices/new">
                <Plus className="size-3.5" aria-hidden />
                Create device
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="py-10 shadow-none">
      <div className="flex flex-col items-center text-center px-5">
        <span className="size-12 rounded-xl bg-secondary text-secondary-foreground grid place-items-center mb-4">
          <HardDrive className="size-5" aria-hidden />
        </span>
        <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
          No devices yet
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
          Register your first device to start tracking your fleet.
        </p>
        <div className="mt-5">
          <Button asChild>
            <Link href="/devices/new">
              <Plus className="size-3.5" aria-hidden />
              Create device
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
