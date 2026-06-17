import { PageShell } from "@/components/app/page-shell";
import { GroupsClient } from "./_components/groups-client";

export default function GroupsPage() {
  return (
    <PageShell title="Groups" crumb="Device categories used across the fleet">
      <GroupsClient />
    </PageShell>
  );
}
