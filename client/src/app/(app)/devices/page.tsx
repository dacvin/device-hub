import { listDevices, type DeviceListFilters } from "@/lib/data/devices";
import { listDepartments } from "@/lib/data/departments";
import { listGroups } from "@/lib/data/groups";
import { listManufacturers } from "@/lib/data/manufacturers";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DeviceListClient } from "./_components/device-list-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    group?: string;
    dept?: string;
    status?: string;
    mfr?: string;
    flag?: string;
    view?: string;
  }>;
}

export default async function DevicesPage({ searchParams }: PageProps) {
  const t = await getTranslations("devices.list");
  const params = await searchParams;
  const filters: DeviceListFilters = {
    q: params.q,
    group: params.group,
    dept: params.dept,
    status: params.status,
    mfr: params.mfr,
    flag: params.flag,
  };
  const view = params.view === "cards" ? "cards" : "table";

  const [devices, groups, departments, manufacturers] = await Promise.all([
    listDevices(filters),
    listGroups(),
    listDepartments(),
    listManufacturers(),
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="size-4" /> {t("export")}
            </Button>
            <Button size="sm" asChild>
              <Link href="/devices/new">
                <Plus className="size-4" /> {t("addDevice")}
              </Link>
            </Button>
          </>
        }
      />
      <DeviceListClient
        devices={devices}
        groups={groups}
        departments={departments}
        manufacturers={manufacturers}
        initialFilters={filters}
        initialView={view}
      />
    </>
  );
}
