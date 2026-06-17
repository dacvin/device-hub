import { createClient } from "@/lib/supabase/client";
import {
  FK_COL_BY_KIND,
  type CatalogKind,
  type CatalogListResult,
  type CatalogRow,
} from "@/lib/domain/catalogs";

export async function listCatalog(kind: CatalogKind): Promise<CatalogListResult> {
  const supabase = createClient();
  const fkCol = FK_COL_BY_KIND[kind];

  const [rowsQ, devicesQ] = await Promise.all([
    supabase.from(kind).select("*").is("deleted_at", null).order("name"),
    supabase
      .from("devices")
      .select(`id, ${fkCol}`)
      .is("deleted_at", null),
  ]);

  if (rowsQ.error) throw rowsQ.error;
  if (devicesQ.error) throw devicesQ.error;

  const counts: Record<string, number> = {};
  for (const d of devicesQ.data ?? []) {
    const id = (d as Record<string, string | null>)[fkCol];
    if (id) counts[id] = (counts[id] ?? 0) + 1;
  }

  type AnyRow = Record<string, string | number | null>;
  const rows: CatalogRow[] = ((rowsQ.data ?? []) as unknown as AnyRow[]).map((r) => {
    const base: CatalogRow = {
      id: r.id as string,
      name: r.name as string,
      deviceCount: counts[r.id as string] ?? 0,
    };
    if (kind === "groups") {
      base.icon = (r.icon as string | null) ?? null;
      base.cycle = (r.default_inventory_cycle_months as number | null) ?? null;
    } else if (kind === "units") {
      base.description = (r.description as string | null) ?? null;
      base.abbreviation = (r.abbreviation as string | null) ?? null;
    } else if (kind === "manufacturers") {
      base.supportContact = (r.support_contact as string | null) ?? null;
    }
    return base;
  });

  return {
    rows,
    totalDevices: (devicesQ.data ?? []).length,
  };
}
