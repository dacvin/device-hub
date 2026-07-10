'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export const MainErrorFallback = () => {
  const t = useTranslations();

  return (
    <div
      role="alert"
      className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <h2 className="text-lg font-semibold">{t('errors.generic')}</h2>
      <Button
        onClick={() => {
          window.location.assign(window.location.origin);
        }}
      >
        {t('errors.refresh')}
      </Button>
    </div>
  );
};
