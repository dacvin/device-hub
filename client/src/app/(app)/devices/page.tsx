"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, Plus } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { DeviceListClient } from "./_components/device-list-client";
import { DeviceSearchInput } from "./_components/device-toolbar";

export default function DevicesPage() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  return (
    <PageShell
      title="Devices"
      crumb="Asset inventory across the fleet"
      actions={
        <>
          <DeviceSearchInput initial={q} />
          <Button variant="outline" size="sm" className="h-9" type="button">
            <Download className="size-3.5" aria-hidden />
            Export
          </Button>
          <Button asChild size="sm" className="h-9">
            <Link href="/devices/new">
              <Plus className="size-3.5" aria-hidden />
              Create device
            </Link>
          </Button>
        </>
      }
    >
      <DeviceListClient />
    </PageShell>
  );
}
