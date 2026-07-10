'use client';

import type { ReactNode } from 'react';

import { DynamicIcon, iconNames } from 'lucide-react/dynamic';
import type { IconName } from 'lucide-react/dynamic';

import { cn } from '@/lib/utils';

import { GROUP_ICONS } from '../constants/group-icons';

const ICON_NAME_SET = new Set<string>(iconNames);

function isIconName(name: string): name is IconName {
  return ICON_NAME_SET.has(name);
}

export function renderLucideIcon(name: string | null): ReactNode {
  if (!name || !isIconName(name)) return null;
  return <DynamicIcon name={name} className="size-4" aria-hidden />;
}

function toLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" className="flex flex-wrap gap-1.5">
      {GROUP_ICONS.map((name) => {
        const isSelected = value === name;
        return (
          <button
            key={name}
            type="button"
            title={toLabel(name)}
            aria-label={toLabel(name)}
            aria-pressed={isSelected}
            onClick={() => {
              onChange(name);
            }}
            className={cn(
              'flex size-9 items-center justify-center rounded-md border transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent',
            )}
          >
            <DynamicIcon name={name} className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
