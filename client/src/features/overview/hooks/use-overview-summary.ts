import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { getOverviewSummary } from "../api/get-overview-summary";

export function useOverviewSummary() {
  return useQuery({
    queryKey: queryKeys.overview.summary,
    queryFn: getOverviewSummary,
  });
}
