"use client";

import { use } from "react";
import { PageShell } from "@/components/app/page-shell";
import { DeviceDetailClient } from "./_components/device-detail-client";

export default function DeviceDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  return (
    <PageShell title="Device details">
      <DeviceDetailClient code={code} />
    </PageShell>
  );
}
