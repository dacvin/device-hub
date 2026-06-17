import { PageShell } from "@/components/app/page-shell";
import { NewDeviceClient } from "./_components/new-device-client";

export default function NewDevicePage() {
  return (
    <PageShell title="Create device">
      <NewDeviceClient />
    </PageShell>
  );
}
