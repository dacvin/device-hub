"use client";

import { useGroupsWithCounts } from "@/features/groups/hooks/use-groups-with-counts";
import { GroupsClient } from "./_components/groups-client";
import { GroupsPageSkeleton } from "./_components/page-skeleton";

export default function GroupsPage() {
  const { data: rows, isPending } = useGroupsWithCounts();
  if (isPending || !rows) return <GroupsPageSkeleton />;
  return <GroupsClient rows={rows} />;
}
