"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ColumnsMenu, type ColumnKey } from "./columns-menu";
import {
  useGroups,
  useManufacturers,
} from "@/features/catalogs/hooks/use-lookups";

interface DeviceToolbarProps {
  hiddenColumns: Set<ColumnKey>;
  onHiddenColumnsChange: (next: Set<ColumnKey>) => void;
}

const ALL = "__all__";

function buildQuery(
  current: URLSearchParams,
  updates: Record<string, string | null>,
): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  const s = next.toString();
  return s ? `?${s}` : "";
}

export function DeviceToolbar({
  hiddenColumns,
  onHiddenColumnsChange,
}: DeviceToolbarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const groups = useGroups();
  const mfrs = useManufacturers();

  const group = params.get("group") ?? "";
  const status = params.get("status") ?? "";
  const flag = params.get("flag") ?? "";
  const manufacturer = params.get("mfr") ?? "";

  const hasFilters = Boolean(group || status || flag || manufacturer);

  const update = useCallback(
    (key: string, value: string) => {
      const url = `/devices${buildQuery(params, { [key]: value || null })}`;
      startTransition(() => router.replace(url, { scroll: false }));
    },
    [params, router],
  );

  function clear() {
    const q = params.get("q") ?? "";
    const view = params.get("view") ?? "";
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (view) next.set("view", view);
    const s = next.toString();
    startTransition(() =>
      router.replace(`/devices${s ? `?${s}` : ""}`, { scroll: false }),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 pt-4">
      <Select
        value={group || ALL}
        onValueChange={(v) => update("group", v === ALL ? "" : v)}
      >
        <SelectTrigger className="h-9 min-w-[140px]">
          <SelectValue placeholder="All groups" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All groups</SelectItem>
          {(groups.data ?? []).map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status || ALL}
        onValueChange={(v) => update("status", v === ALL ? "" : v)}
      >
        <SelectTrigger className="h-9 min-w-[140px]">
          <SelectValue placeholder="Any status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any status</SelectItem>
          <SelectItem value="in-use">In use</SelectItem>
          <SelectItem value="storage">In storage</SelectItem>
          <SelectItem value="repair">In repair</SelectItem>
          <SelectItem value="retired">Retired</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={flag || ALL}
        onValueChange={(v) => update("flag", v === ALL ? "" : v)}
      >
        <SelectTrigger className="h-9 min-w-[120px]">
          <SelectValue placeholder="Any flag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any flag</SelectItem>
          <SelectItem value="warranty">Warranty expiring</SelectItem>
          <SelectItem value="inventory">Inventory overdue</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={manufacturer || ALL}
        onValueChange={(v) => update("mfr", v === ALL ? "" : v)}
      >
        <SelectTrigger className="h-9 min-w-[160px]">
          <SelectValue placeholder="All manufacturers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All manufacturers</SelectItem>
          {(mfrs.data ?? []).map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-dashed"
          onClick={clear}
        >
          <X className="size-3.5" aria-hidden />
          Clear
        </Button>
      ) : null}

      <div className="ml-auto">
        <ColumnsMenu hidden={hiddenColumns} onChange={onHiddenColumnsChange} />
      </div>
    </div>
  );
}

interface SearchInputProps {
  initial?: string;
}

export function DeviceSearchInput({ initial = "" }: SearchInputProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      const url = `/devices${buildQuery(params, { q: value || null })}`;
      startTransition(() => router.replace(url, { scroll: false }));
    }, 220);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search code, name, serial…"
      className="h-9 w-[240px] max-[640px]:w-full rounded-md border border-input bg-card px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
    />
  );
}
