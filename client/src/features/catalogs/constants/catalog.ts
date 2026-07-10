export const CATALOG_RESOURCES = ['groups', 'manufacturers'] as const;
export type CatalogResource = (typeof CATALOG_RESOURCES)[number];

export function isCatalogResource(value: string): value is CatalogResource {
  return (CATALOG_RESOURCES as readonly string[]).includes(value);
}

// Sortable columns per resource (snake_case — matches DB columns).
export const GROUP_SORTABLE_COLUMNS = ['name', 'created_at'] as const;
export const MANUFACTURER_SORTABLE_COLUMNS = ['name', 'created_at'] as const;
