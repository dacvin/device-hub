export type CatalogKind = "groups" | "units" | "manufacturers";

export interface CatalogRow {
  id: string;
  name: string;
  deviceCount: number;
  // group-only
  icon?: string | null;
  cycle?: number | null;
  // unit-only
  description?: string | null;
  abbreviation?: string | null;
  // manufacturer-only
  supportContact?: string | null;
}

export interface CatalogListResult {
  rows: CatalogRow[];
  totalDevices: number;
}

export interface GroupRow {
  id: string;
  name: string;
  icon: string | null;
  default_inventory_cycle_months: number;
}

export interface UnitRow {
  id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
}

export interface ManufacturerRow {
  id: string;
  name: string;
  support_contact: string | null;
}

export interface SimpleLookup {
  id: string;
  name: string;
}

export const FK_COL_BY_KIND: Record<CatalogKind, "group_id" | "unit_id" | "manufacturer_id"> = {
  groups: "group_id",
  units: "unit_id",
  manufacturers: "manufacturer_id",
};
