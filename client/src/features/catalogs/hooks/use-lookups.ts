import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import {
  listGroupsSimple,
  listManufacturersSimple,
  listUnitsSimple,
} from "../api/list-lookups";

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: listGroupsSimple,
  });
}

export function useUnits() {
  return useQuery({
    queryKey: queryKeys.units.all,
    queryFn: listUnitsSimple,
  });
}

export function useManufacturers() {
  return useQuery({
    queryKey: queryKeys.manufacturers.all,
    queryFn: listManufacturersSimple,
  });
}
