'use client';

import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Icon-only button with an accessible label surfaced both as aria-label and a
// hover/focus tooltip. Use anywhere a button has no visible text.
export function IconButton({
  label,
  children,
  side = 'top',
  ...props
}: ComponentProps<typeof Button> & { label: string; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
