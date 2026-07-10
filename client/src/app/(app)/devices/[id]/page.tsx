import { DeviceDetailClient } from '@/features/devices/components/device-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeviceDetailClient deviceId={id} />;
}
