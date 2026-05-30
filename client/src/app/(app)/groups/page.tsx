import { listGroupsWithCounts } from "@/lib/data/groups";
import { GroupsClient } from "./_components/groups-client";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const rows = await listGroupsWithCounts();
  return <GroupsClient rows={rows} />;
}
