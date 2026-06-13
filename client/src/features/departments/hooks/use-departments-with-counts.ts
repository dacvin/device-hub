import { useQuery } from "@tanstack/react-query";
import { listDepartmentsWithCounts } from "@/features/departments/api/list-departments-with-counts";
import { queryKeys } from "@/lib/queries/keys";

export function useDepartmentsWithCounts() {
  return useQuery({
    queryKey: queryKeys.departments.withCounts,
    queryFn: listDepartmentsWithCounts,
  });
}
