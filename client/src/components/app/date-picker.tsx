'use client';

import { useState } from 'react';

import { CalendarIcon } from 'lucide-react';
import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  ariaInvalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaInvalid?: boolean;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const date = value ? new Date(`${value}T00:00:00`) : undefined;
  const label = date
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={ariaInvalid}
          className={cn('w-full justify-start font-normal', !value && 'text-muted-foreground')}
        >
          <CalendarIcon className="opacity-60" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          captionLayout="dropdown"
          onSelect={(d) => {
            onChange(d ? toISODate(d) : '');
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
