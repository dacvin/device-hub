"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
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
import {
  DEVICE_STATUSES,
  STATUS_LABEL,
  type Department,
  type DeviceGroup,
  type DeviceWithFlags,
  type Manufacturer,
} from "@/lib/domain/devices";
import { cn } from "@/lib/utils";
import type { DeviceListFilters } from "@/lib/data/devices";

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

  const columns = useMemo<ColumnDef<DeviceWithFlags>[]>(
    () => buildColumns(lookups),
    [lookups]
  );

  const table = useReactTable({
    data: devices,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const filterActive =
    !!(initialFilters.q ||
      initialFilters.group ||
      initialFilters.dept ||
      initialFilters.status ||
      initialFilters.mfr ||
      initialFilters.flag);

  return (
    <div className="space-y-4">
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

      <div className="text-xs text-muted-foreground">
        {devices.length} of {devices.length} devices
      </div>

      {view === "table" ? (
        <DeviceTable table={table} />
      ) : (
        <DeviceCards devices={devices} lookups={lookups} />
      )}

      {devices.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No devices match these filters.
        </div>
      )}
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
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search code, name, serial…"
            className="pl-8 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && onViewChange(v as "table" | "cards")}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="table" aria-label="Comfortable view">
              Comfortable
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="Cards view">
              Cards
            </ToggleGroupItem>
          </ToggleGroup>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="size-4" /> Columns
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
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
                          Required
                        </span>
                      )}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={initialFilters.group ?? ""}
          onChange={(v) => onFilterChange("group", v)}
          placeholder="All groups"
          allLabel="All groups"
          options={groups.map((g) => ({ value: g.id, label: g.name }))}
        />
        <FilterSelect
          value={initialFilters.dept ?? ""}
          onChange={(v) => onFilterChange("dept", v)}
          placeholder="All departments"
          allLabel="All departments"
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
        />
        <FilterSelect
          value={initialFilters.status ?? ""}
          onChange={(v) => onFilterChange("status", v)}
          placeholder="Any status"
          allLabel="Any status"
          options={DEVICE_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
        />
        <FilterSelect
          value={initialFilters.flag ?? ""}
          onChange={(v) => onFilterChange("flag", v)}
          placeholder="Any flag"
          allLabel="Any flag"
          options={[
            { value: "warranty-expiring", label: "Warranty expiring" },
            { value: "inventory-overdue", label: "Inventory overdue" },
          ]}
        />
        <FilterSelect
          value={initialFilters.mfr ?? ""}
          onChange={(v) => onFilterChange("mfr", v)}
          placeholder="All manufacturers"
          allLabel="All manufacturers"
          options={manufacturers.map((m) => ({ value: m.id, label: m.name }))}
        />

        {filterActive && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <X className="size-3" /> Clear
          </button>
        )}
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
      <SelectTrigger size="sm" className="h-9 min-w-[160px] text-xs">
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

const COLUMN_LABELS: Record<string, string> = {
  type: "Type icon",
  code: "Code",
  name: "Name",
  group: "Group",
  department: "Department",
  manufacturer: "Manufacturer / Model",
  condition: "Condition",
  location: "Location",
  status: "Status",
  flags: "Flags",
  quantity: "Quantity",
  actions: "Actions",
};

function buildColumns(lookups: Lookups): ColumnDef<DeviceWithFlags>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableHiding: false,
      size: 32,
    },
    {
      id: "type",
      header: "",
      cell: ({ row }) => (
        <GroupIcon icon={lookups.groups.get(row.original.groupId)?.icon ?? null} size="sm" />
      ),
    },
    {
      id: "code",
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
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
      header: "Group",
      cell: ({ row }) => {
        const g = lookups.groups.get(row.original.groupId);
        return g ? <Badge variant="secondary">{g.name}</Badge> : null;
      },
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => lookups.departments.get(row.original.departmentId)?.name ?? "—",
    },
    {
      id: "manufacturer",
      header: "Manufacturer / Model",
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
      header: "Condition",
      cell: ({ row }) => <ConditionBar value={row.original.condition} />,
    },
    {
      id: "location",
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.location ?? "—"}</span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "flags",
      header: "Flags",
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
      header: "Qty",
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
              <span className="sr-only">Edit</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <MoreHorizontal className="size-3.5" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/devices/${encodeURIComponent(row.original.code)}`}>View details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/devices/${encodeURIComponent(row.original.code)}/edit`}>Edit</Link>
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
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((h) => (
                <TableHead key={h.id} className="text-xs uppercase tracking-wide text-muted-foreground">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="group/row h-14 hover:bg-muted/40">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-2">
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
              "group rounded-xl border border-border bg-card overflow-hidden",
              "transition-colors hover:border-ring focus:border-ring focus:outline-none"
            )}
          >
            <div
              className="relative h-[120px] bg-gradient-to-br from-secondary via-muted to-background flex items-center justify-center"
            >
              <GroupIcon icon={g?.icon ?? null} size="md" className="bg-card" />
              <div className="absolute top-2 right-2">
                <StatusBadge status={d.status} />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="font-semibold leading-snug">{d.name}</div>
                <div className="font-mono text-xs text-muted-foreground mt-0.5">{d.code}</div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <Meta label="Department" value={dept?.name ?? "—"} />
                <Meta label="Group" value={g?.name ?? "—"} />
                <Meta label="Location" value={d.location ?? "—"} span={2} />
              </div>

              {d.flags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {d.flags.map((f) => (
                    <FlagChip key={f} flag={f} />
                  ))}
                </div>
              )}

              <div className="flex items-end justify-between pt-1">
                <ConditionBar value={d.condition} />
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Qty</div>
                  <div className="font-medium tabular-nums">{d.quantity}</div>
                </div>
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
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
