import { PageShell } from "@/components/app/page-shell";
import { MembersClient } from "./_components/members-client";

export default function MembersPage() {
  return (
    <PageShell title="Members" crumb="Who has access to DeviceHub">
      <MembersClient />
    </PageShell>
  );
}
