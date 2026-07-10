import { Suspense } from 'react';

import { DevicesClient } from '@/features/devices/components/devices-client';

export default function DevicesPage() {
  return (
    <Suspense>
      <DevicesClient />
    </Suspense>
  );
}
