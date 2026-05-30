import { listManufacturersWithCounts } from "@/lib/data/manufacturers";
import { ManufacturersClient } from "./_components/manufacturers-client";

export const dynamic = "force-dynamic";

export default async function ManufacturersPage() {
  const rows = await listManufacturersWithCounts();
  return <ManufacturersClient rows={rows} />;
}
