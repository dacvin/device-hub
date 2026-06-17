import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { listCatalog } from "../api/list-catalog";
import type { CatalogKind } from "@/lib/domain/catalogs";

export function useCatalog(kind: CatalogKind) {
  return useQuery({
    queryKey: queryKeys[kind].withCounts,
    queryFn: () => listCatalog(kind),
  });
}
