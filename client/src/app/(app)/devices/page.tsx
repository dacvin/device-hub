"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { useDevices } from "@/features/devices/hooks/use-devices";
import type { DeviceListFilters } from "@/features/devices/api/get-devices";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useManufacturers } from "@/features/manufacturers/hooks/use-manufacturers";
import { PageShell } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { DeviceListClient } from "./_components/device-list-client";
import { DevicesPageSkeleton } from "./_components/page-skeleton";

export default function DevicesPage() {
  const t = useTranslations("devices.list");
  const params = useSearchParams();
  const filters: DeviceListFilters = {
    q: params.get("q") ?? undefined,
    group: params.get("group") ?? undefined,
    dept: params.get("dept") ?? undefined,
    status: params.get("status") ?? undefined,
    mfr: params.get("mfr") ?? undefined,
    flag: params.get("flag") ?? undefined,
  };
  const view = params.get("view") === "cards" ? "cards" : "table";

  const devicesQ = useDevices(filters);
  const groupsQ = useGroups();
  const deptsQ = useDepartments();
  const mfrsQ = useManufacturers();

  if (devicesQ.isPending || groupsQ.isPending || deptsQ.isPending || mfrsQ.isPending) {
    return <DevicesPageSkeleton />;
  }

  return (
    <PageShell
      title={t("title")}
      crumb={t("subtitle")}
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
    >
      <DeviceListClient
        devices={devicesQ.data ?? []}
        groups={groupsQ.data ?? []}
        departments={deptsQ.data ?? []}
        manufacturers={mfrsQ.data ?? []}
        initialFilters={filters}
        initialView={view}
      />
    </PageShell>
  );
}
