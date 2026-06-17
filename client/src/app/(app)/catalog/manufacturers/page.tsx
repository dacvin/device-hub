import { PageShell } from "@/components/app/page-shell";
import { ManufacturersClient } from "./_components/manufacturers-client";

export default function ManufacturersPage() {
  return (
    <PageShell title="Manufacturers" crumb="Vendors of the devices in the fleet">
      <ManufacturersClient />
    </PageShell>
  );
}
