import { PageShell } from "@/components/app/page-shell";
import { UnitsClient } from "./_components/units-client";

export default function UnitsPage() {
  return (
    <PageShell title="Units" crumb="Units of measure for inventory quantities">
      <UnitsClient />
    </PageShell>
  );
}
