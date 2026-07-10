'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import type { CatalogResource } from '../constants/catalog';

const TABS: { value: CatalogResource; href: string; labelKey: string }[] = [
  { value: 'groups', href: '/catalogs/groups', labelKey: 'tabGroups' },
  { value: 'manufacturers', href: '/catalogs/manufacturers', labelKey: 'tabManufacturers' },
];

export function CatalogTabs({ active }: { active: CatalogResource }) {
  const t = useTranslations('catalogs');
  return (
    <div className="border-b">
      <nav className="-mb-px flex gap-6">
        {TABS.map((tab) => {
          const isActive = tab.value === active;
          return (
            <Link
              key={tab.value}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
