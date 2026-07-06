'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { setLocale } from '@/lib/set-locale';

export function LocaleSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(locale: string) {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        disabled={isPending}
        onClick={() => {
          switchTo('en');
        }}
      >
        EN
      </Button>
      <Button
        disabled={isPending}
        onClick={() => {
          switchTo('vi');
        }}
      >
        VI
      </Button>
    </div>
  );
}
