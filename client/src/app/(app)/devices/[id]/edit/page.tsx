import { DeviceEditPage } from '@/features/devices/components/device-form-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeviceEditPage deviceId={id} />;
}
