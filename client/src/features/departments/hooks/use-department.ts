import { useQuery } from "@tanstack/react-query";
import { getDepartmentById } from "@/features/departments/api/get-department";
import { queryKeys } from "@/lib/queries/keys";

export function useDepartmentById(id: string) {
  return useQuery({
    queryKey: queryKeys.departments.byId(id),
    queryFn: () => getDepartmentById(id),
    enabled: !!id,
  });
}
