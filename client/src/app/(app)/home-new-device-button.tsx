'use client';

import Link from 'next/link';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export function HomeNewDeviceButton() {
  const t = useTranslations();

  return (
    <Button asChild>
      <Link href="/devices/new">
        <Plus />
        {t('devices.newDevice')}
      </Link>
    </Button>
  );
}
