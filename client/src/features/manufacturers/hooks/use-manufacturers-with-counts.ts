import { useQuery } from "@tanstack/react-query";
import { listManufacturersWithCounts } from "@/features/manufacturers/api/list-manufacturers-with-counts";
import { queryKeys } from "@/lib/queries/keys";

export function useManufacturersWithCounts() {
  return useQuery({
    queryKey: queryKeys.manufacturers.withCounts,
    queryFn: listManufacturersWithCounts,
  });
}
