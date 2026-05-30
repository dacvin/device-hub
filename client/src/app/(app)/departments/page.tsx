import { listDepartmentsWithCounts } from "@/lib/data/departments";
import { DepartmentsClient } from "./_components/departments-client";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const rows = await listDepartmentsWithCounts();
  return <DepartmentsClient rows={rows} />;
}
