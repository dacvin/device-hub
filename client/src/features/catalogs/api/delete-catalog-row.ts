import { createClient } from "@/lib/supabase/client";
import { FK_COL_BY_KIND, type CatalogKind } from "@/lib/domain/catalogs";

export class CatalogInUseError extends Error {
  constructor(public count: number) {
    super(`Can't delete — ${count} device${count === 1 ? "" : "s"} assigned`);
    this.name = "CatalogInUseError";
  }
}

export async function deleteCatalogRow(
  kind: CatalogKind,
  id: string,
): Promise<void> {
  const supabase = createClient();
  const fkCol = FK_COL_BY_KIND[kind];

  const { count, error: countError } = await supabase
    .from("devices")
    .select("id", { count: "exact", head: true })
    .eq(fkCol, id)
    .is("deleted_at", null);
  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    throw new CatalogInUseError(count ?? 0);
  }
  const { error } = await supabase
    .from(kind)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
