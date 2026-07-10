import { Suspense } from 'react';

import { CheckoutsClient } from '@/features/checkouts/components/checkouts-client';

export default function CheckoutsPage() {
  return (
    <Suspense>
      <CheckoutsClient />
    </Suspense>
  );
}
