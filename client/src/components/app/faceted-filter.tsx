'use client';

import type { ReactNode } from 'react';

import { Check, PlusCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type FacetOption = { value: string; label: string; icon?: ReactNode };

/** Multi-select "faceted" filter (shadcn data-table pattern): Popover + Command + checkboxes. */
export function FacetedFilter({
  label,
  options,
  selected,
  onChange,
  emptyLabel,
  clearLabel,
}: {
  label: string;
  options: FacetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyLabel: string;
  clearLabel: string;
}) {
  const selectedSet = new Set(selected);

  function toggle(value: string) {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <PlusCircle />
          {label}
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-mono font-normal tracking-[-0.01em] tabular-nums"
              >
                {selected.length}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder={label} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selectedSet.has(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => {
                      toggle(opt.value);
                    }}
                  >
                    <span
                      className={cn(
                        'flex size-4 items-center justify-center rounded-[4px] border',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 [&_svg]:invisible',
                      )}
                    >
                      <Check className="size-3" />
                    </span>
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onChange([]);
                    }}
                    className="justify-center text-center"
                  >
                    {clearLabel}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
