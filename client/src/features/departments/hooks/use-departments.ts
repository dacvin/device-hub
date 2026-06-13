import { useQuery } from "@tanstack/react-query";
import { listDepartments } from "@/features/departments/api/list-departments";
import { queryKeys } from "@/lib/queries/keys";

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: listDepartments,
  });
}
