import { escapePostgrestValue } from '@/features/members/api/search-filter';

// Builds the `.or(...)` argument matching the term against code OR name OR serial_number.
export function buildDeviceSearch(q: string): string {
  const escaped = escapePostgrestValue(q);
  return `code.ilike."%${escaped}%",name.ilike."%${escaped}%",serial_number.ilike."%${escaped}%"`;
}
