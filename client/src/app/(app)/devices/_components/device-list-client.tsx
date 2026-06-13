"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  Pencil,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GroupIcon } from "@/components/app/group-icon";
import { StatusBadge } from "@/components/app/status-badge";
import { FlagChip } from "@/components/app/flag-chip";
import { ConditionBar } from "@/components/app/condition-bar";
import { DeviceBulkActions } from "./device-bulk-actions";
import {
  DEVICE_FLAGS,
  DEVICE_STATUSES,
  type Department,
  type DeviceGroup,
  type DeviceWithFlags,
  type Manufacturer,
} from "@/lib/domain/devices";
import { cn } from "@/lib/utils";
import type { DeviceListFilters } from "@/features/devices/api/get-devices";

const COLUMNS_LS_KEY = "dh-cols";

interface Props {
  devices: DeviceWithFlags[];
  groups: DeviceGroup[];
  departments: Department[];
  manufacturers: Manufacturer[];
  initialFilters: DeviceListFilters;
  initialView: "table" | "cards";
}

interface Lookups {
  groups: Map<string, DeviceGroup>;
  departments: Map<string, Department>;
  manufacturers: Map<string, Manufacturer>;
}

export function DeviceListClient({
  devices,
  groups,
  departments,
  manufacturers,
  initialFilters,
  initialView,
}: Props) {
  const tList = useTranslations("devices.list");
  const tCols = useTranslations("devices.columns");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const lookups: Lookups = useMemo(
    () => ({
      groups: new Map(groups.map((g) => [g.id, g])),
      departments: new Map(departments.map((d) => [d.id, d])),
      manufacturers: new Map(manufacturers.map((m) => [m.id, m])),
    }),
    [groups, departments, manufacturers]
  );

  const [searchTerm, setSearchTerm] = useState(initialFilters.q ?? "");
  useEffect(() => {
    setSearchTerm(initialFilters.q ?? "");
  }, [initialFilters.q]);

  // Debounced URL update for search
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (searchTerm === current) return;
    const handle = setTimeout(() => {
      setParam("q", searchTerm || null);
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || value === "__all__") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const queryString = next.toString();
    startTransition(() => {
      router.replace(queryString ? `/devices?${queryString}` : "/devices");
    });
  }

  function clearAll() {
    startTransition(() => router.replace("/devices"));
    setSearchTerm("");
  }

  const view = initialView;

  // Column visibility persisted to localStorage
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLUMNS_LS_KEY);
      if (raw) setColumnVisibility(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(COLUMNS_LS_KEY, JSON.stringify(columnVisibility));
    } catch {
      /* ignore */
    }
  }, [columnVisibility]);

  // Row selection
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo<ColumnDef<DeviceWithFlags>[]>(
    () => buildColumns(lookups, tList, tCols),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lookups]
  );

  const table = useReactTable({
    data: devices,
    columns,
    state: { columnVisibility, rowSelection },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedIds = useMemo(() => {
    return new Set(table.getSelectedRowModel().rows.map((r) => r.original.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, devices]);

  function clearSelection() {
    setRowSelection({});
  }

  const filterActive =
    !!(initialFilters.q ||
      initialFilters.group ||
      initialFilters.dept ||
      initialFilters.status ||
      initialFilters.mfr ||
      initialFilters.flag);

  return (
    <div>
      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        groups={groups}
        departments={departments}
        manufacturers={manufacturers}
        initialFilters={initialFilters}
        onFilterChange={setParam}
        onClear={clearAll}
        filterActive={filterActive}
        view={view}
        onViewChange={(v) => setParam("view", v === "table" ? null : v)}
        table={table}
      />

      <div className="mb-3 text-sm text-muted-foreground">
        {tList("countOfTotal", { shown: devices.length, total: devices.length })}
      </div>

      {view === "table" ? (
        <DeviceTable table={table} />
      ) : (
        <DeviceCards devices={devices} lookups={lookups} />
      )}

      {devices.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          {tList("emptyState")}
        </div>
      )}

      <DeviceBulkActions selected={selectedIds} onClear={clearSelection} />
    </div>
  );
}

interface ToolbarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  groups: DeviceGroup[];
  departments: Department[];
  manufacturers: Manufacturer[];
  initialFilters: DeviceListFilters;
  onFilterChange: (key: string, value: string | null) => void;
  onClear: () => void;
  filterActive: boolean;
  view: "table" | "cards";
  onViewChange: (v: "table" | "cards") => void;
  table: ReturnType<typeof useReactTable<DeviceWithFlags>>;
}

function Toolbar({
  searchTerm,
  onSearchChange,
  groups,
  departments,
  manufacturers,
  initialFilters,
  onFilterChange,
  onClear,
  filterActive,
  view,
  onViewChange,
  table,
}: ToolbarProps) {
  const tList = useTranslations("devices.list");
  const tCols = useTranslations("devices.columns");
  const tStatus = useTranslations("devices.status");
  const tFlag = useTranslations("devices.flag");

  const COLUMN_LABELS: Record<string, string> = {
    type: tCols("typeIcon"),
    code: tCols("code"),
    name: tCols("name"),
    group: tCols("group"),
    department: tCols("department"),
    manufacturer: tList("columnManufacturer"),
    condition: tCols("condition"),
    location: tCols("location"),
    status: tCols("status"),
    flags: tCols("flags"),
    quantity: tCols("quantity"),
    actions: tCols("actions"),
  };

  return (
    <div className="mb-4">
      <div className="mb-3 relative w-full sm:w-[320px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={tList("searchPlaceholder")}
          className="pl-8 h-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <FilterSelect
          value={initialFilters.group ?? ""}
          onChange={(v) => onFilterChange("group", v)}
          placeholder={tList("filterAllGroups")}
          allLabel={tList("filterAllGroups")}
          options={groups.map((g) => ({ value: g.id, label: g.name }))}
        />
        <FilterSelect
          value={initialFilters.dept ?? ""}
          onChange={(v) => onFilterChange("dept", v)}
          placeholder={tList("filterAllDepartments")}
          allLabel={tList("filterAllDepartments")}
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
        />
        <FilterSelect
          value={initialFilters.status ?? ""}
          onChange={(v) => onFilterChange("status", v)}
          placeholder={tList("filterAnyStatus")}
          allLabel={tList("filterAnyStatus")}
          options={DEVICE_STATUSES.map((s) => ({ value: s, label: tStatus(s) }))}
        />
        <FilterSelect
          value={initialFilters.flag ?? ""}
          onChange={(v) => onFilterChange("flag", v)}
          placeholder={tList("filterAnyFlag")}
          allLabel={tList("filterAnyFlag")}
          options={DEVICE_FLAGS.map((f) => ({ value: f, label: tFlag(f) }))}
        />
        <FilterSelect
          value={initialFilters.mfr ?? ""}
          onChange={(v) => onFilterChange("mfr", v)}
          placeholder={tList("filterAllManufacturers")}
          allLabel={tList("filterAllManufacturers")}
          options={manufacturers.map((m) => ({ value: m.id, label: m.name }))}
        />

        {filterActive && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          >
            <X className="size-3.5" /> {tList("clearFilters")}
          </button>
        )}

        <div className="flex-1" />

        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && onViewChange(v as "table" | "cards")}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="table" aria-label={tList("viewComfortable")}>
            {tList("viewComfortableShort")}
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label={tList("viewCards")}>
            {tList("viewCardsShort")}
          </ToggleGroupItem>
        </ToggleGroup>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="size-4" /> {tList("columnsTrigger")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{tList("toggleColumns")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllLeafColumns()
              .filter((c) => c.id !== "select")
              .map((column) => {
                const locked = column.id === "name";
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    disabled={locked}
                    onCheckedChange={(value) =>
                      !locked && column.toggleVisibility(!!value)
                    }
                  >
                    <span className="capitalize">
                      {COLUMN_LABELS[column.id] ?? column.id}
                    </span>
                    {locked && (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {tList("requiredColumn")}
                      </span>
                    )}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string | null) => void;
  placeholder: string;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value || "__all__"}
      onValueChange={(v) => onChange(v === "__all__" ? null : v)}
    >
      <SelectTrigger size="sm" className="h-9 min-w-[140px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function buildColumns(
  lookups: Lookups,
  tList: ReturnType<typeof useTranslations>,
  tCols: ReturnType<typeof useTranslations>
): ColumnDef<DeviceWithFlags>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label={tList("selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={tList("selectRow")}
        />
      ),
      enableHiding: false,
      size: 32,
    },
    {
      id: "type",
      header: "",
      cell: ({ row }) => (
        <GroupIcon icon={lookups.groups.get(row.original.groupId)?.icon ?? null} size="md" />
      ),
    },
    {
      id: "code",
      accessorKey: "code",
      header: tCols("code"),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      header: tCols("name"),
      cell: ({ row }) => (
        <Link
          href={`/devices/${encodeURIComponent(row.original.code)}`}
          className="font-medium hover:text-primary"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "group",
      header: tCols("group"),
      cell: ({ row }) => {
        const g = lookups.groups.get(row.original.groupId);
        return g ? <Badge variant="secondary">{g.name}</Badge> : null;
      },
    },
    {
      id: "department",
      header: tCols("department"),
      cell: ({ row }) => lookups.departments.get(row.original.departmentId)?.name ?? "—",
    },
    {
      id: "manufacturer",
      header: tList("columnManufacturer"),
      cell: ({ row }) => {
        const m = row.original.manufacturerId
          ? lookups.manufacturers.get(row.original.manufacturerId)
          : null;
        return (
          <div className="leading-tight">
            <div className="text-sm">{m?.name ?? "—"}</div>
            {row.original.model && (
              <div className="text-xs text-muted-foreground">{row.original.model}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "condition",
      accessorKey: "condition",
      header: tCols("condition"),
      cell: ({ row }) => <ConditionBar value={row.original.condition} />,
    },
    {
      id: "location",
      accessorKey: "location",
      header: tCols("location"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.location ?? "—"}</span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: tCols("status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "flags",
      header: tCols("flags"),
      cell: ({ row }) => {
        if (row.original.flags.length === 0)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {row.original.flags.map((f) => (
              <FlagChip key={f} flag={f} />
            ))}
          </div>
        );
      },
    },
    {
      id: "quantity",
      accessorKey: "quantity",
      header: tCols("quantity"),
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{row.original.quantity}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" className="size-7" asChild>
            <Link href={`/devices/${encodeURIComponent(row.original.code)}/edit`}>
              <Pencil className="size-3.5" />
              <span className="sr-only">{tList("edit")}</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <MoreHorizontal className="size-3.5" />
                <span className="sr-only">{tList("more")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/devices/${encodeURIComponent(row.original.code)}`}>{tList("viewDetails")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/devices/${encodeURIComponent(row.original.code)}/edit`}>{tList("edit")}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}

function DeviceTable({ table }: { table: ReturnType<typeof useReactTable<DeviceWithFlags>> }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className="h-11 px-4 text-xs font-medium text-muted-foreground"
                >
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="group/row h-14 hover:bg-muted">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-4 py-0 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DeviceCards({
  devices,
  lookups,
}: {
  devices: DeviceWithFlags[];
  lookups: Lookups;
}) {
  const tList = useTranslations("devices.list");
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {devices.map((d) => {
        const g = lookups.groups.get(d.groupId);
        const dept = lookups.departments.get(d.departmentId);
        return (
          <Link
            key={d.id}
            href={`/devices/${encodeURIComponent(d.code)}`}
            className={cn(
              "group flex flex-col rounded-[var(--radius-xl)] border border-border bg-card shadow-sm overflow-hidden",
              "transition-[border-color,box-shadow] duration-150",
              "hover:border-ring hover:shadow-[0_2px_10px_rgba(16,24,40,0.06)]",
              "focus:border-ring focus:outline-none"
            )}
          >
            <div
              className={cn(
                "relative h-[132px] flex items-center justify-center border-b border-border",
                "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--green-100)_70%,var(--card)),color-mix(in_oklch,var(--green-200)_55%,var(--card)))]",
                "dark:bg-[linear-gradient(135deg,color-mix(in_oklch,var(--green-800)_30%,var(--card)),color-mix(in_oklch,var(--secondary)_80%,var(--card)))]"
              )}
            >
              <GroupIcon icon={g?.icon ?? null} size="xl" />
              <div className="absolute top-3 right-3">
                <StatusBadge status={d.status} />
              </div>
            </div>
            <div className="flex flex-1 flex-col px-[18px] pt-4 pb-[18px]">
              <div>
                <h3 className="text-[15px] font-semibold leading-snug">{d.name}</h3>
                <div className="font-mono text-xs text-muted-foreground mt-0.5">{d.code}</div>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Meta label={tList("metaDepartment")} value={dept?.name ?? "—"} />
                <Meta label={tList("metaGroup")} value={g?.name ?? "—"} />
                <Meta label={tList("metaLocation")} value={d.location ?? "—"} span={2} />
              </div>

              {d.flags.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-1">
                  {d.flags.map((f) => (
                    <FlagChip key={f} flag={f} />
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between pt-[18px] border-t border-border">
                <ConditionBar value={d.condition} />
                <span className="text-xs text-muted-foreground">
                  {tList("metaQty")} {d.quantity}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Meta({ label, value, span }: { label: string; value: string; span?: 2 }) {
  return (
    <div className={span === 2 ? "col-span-2" : undefined}>
      <div className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground">{label}</div>
      <div className="mt-px text-[13px] font-medium">{value}</div>
    </div>
  );
}
