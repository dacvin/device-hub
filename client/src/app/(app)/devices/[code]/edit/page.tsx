"use client";

import { use } from "react";
import { PageShell } from "@/components/app/page-shell";
import { EditDeviceClient } from "./_components/edit-device-client";

export default function EditDevicePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  return (
    <PageShell title="Edit device">
      <EditDeviceClient code={code} />
    </PageShell>
  );
}
