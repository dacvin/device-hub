import { useQuery } from "@tanstack/react-query";
import { getOrgSettings } from "@/features/settings/api/get-org-settings";
import { queryKeys } from "@/lib/queries/keys";

export function useOrgSettings() {
  return useQuery({
    queryKey: queryKeys.orgSettings,
    queryFn: getOrgSettings,
  });
}
