import { useQuery } from "@tanstack/react-query";
import { listManufacturers } from "@/features/manufacturers/api/list-manufacturers";
import { queryKeys } from "@/lib/queries/keys";

export function useManufacturers() {
  return useQuery({
    queryKey: queryKeys.manufacturers.all,
    queryFn: listManufacturers,
  });
}
