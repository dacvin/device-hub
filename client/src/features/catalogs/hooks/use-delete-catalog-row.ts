import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { deleteCatalogRow } from "../api/delete-catalog-row";
import type { CatalogKind } from "@/lib/domain/catalogs";

export function useDeleteCatalogRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: CatalogKind; id: string }) =>
      deleteCatalogRow(kind, id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys[vars.kind].all });
      qc.invalidateQueries({ queryKey: queryKeys[vars.kind].withCounts });
    },
  });
}
