import { useQuery } from "@tanstack/react-query";
import { getManufacturerById } from "@/features/manufacturers/api/get-manufacturer";
import { queryKeys } from "@/lib/queries/keys";

export function useManufacturerById(id: string) {
  return useQuery({
    queryKey: queryKeys.manufacturers.byId(id),
    queryFn: () => getManufacturerById(id),
    enabled: !!id,
  });
}
