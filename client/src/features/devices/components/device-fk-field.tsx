'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { AnyFieldApi } from '@tanstack/react-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';

export type FkOption = {
  id: string;
  label: string;
  auxiliaryData?: { defaultInventoryCycleMonths?: number };
};

export type FkSearch = (query: string) => Promise<FkOption[]>;

// Builds an async search fn from a "fetch a page" fn + a row→option mapper.
export function makeCatalogSearchSource<TRow>(
  fetchPage: (q: string) => Promise<{ items: TRow[] }>,
  mapItem: (row: TRow) => FkOption,
): FkSearch {
  return async (query: string) => {
    const { items } = await fetchPage(query);
    return items.map(mapItem);
  };
}

// Minimal structural view of a TanStack form for the add-new render-prop.
export type AddNewForm = {
  Field: React.ComponentType<{
    name: string;
    children: (field: AnyFieldApi) => ReactNode;
  }>;
};

type AddNewConfig = {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema input differs from output when transforms apply.
  schema: z.ZodType<Record<string, unknown>, any>;
  defaultValues: Record<string, unknown>;
  create: (
    values: Record<string, unknown>,
  ) => Promise<{ id: string; name: string; defaultInventoryCycleMonths?: number }>;
  renderFields: (form: AddNewForm) => ReactNode;
  invalidateKey: readonly unknown[];
};

function AddNewDialog({
  open,
  onOpenChange,
  config,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AddNewConfig;
  onCreated: (option: FkOption) => void;
}) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: config.defaultValues,
    validators: { onSubmit: config.schema },
    onSubmit: async ({ value }) => {
      try {
        const created = await config.create(value);
        await queryClient.invalidateQueries({ queryKey: config.invalidateKey });
        onCreated({
          id: created.id,
          label: created.name,
          auxiliaryData: { defaultInventoryCycleMonths: created.defaultInventoryCycleMonths },
        });
        onOpenChange(false);
        form.reset();
      } catch (err) {
        const raw = err instanceof Error ? err.message : '';
        toast.error(raw === 'catalogs.duplicateName' ? t(raw) : t('catalogs.saveFailed'));
      }
    },
  });

  const formId = 'add-new-catalog-form';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
        </DialogHeader>
        <form
          id={formId}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-4 py-2"
        >
          {config.renderFields(form)}
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {t('catalogs.cancel')}
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={formId} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {t('catalogs.save')}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeviceFkField({
  field,
  label,
  placeholder,
  search,
  initialItem = null,
  addNewLabel,
  addNew,
  onSelectItem,
}: {
  field: AnyFieldApi;
  label: string;
  placeholder: string;
  search: FkSearch;
  initialItem?: FkOption | null;
  addNewLabel: string;
  addNew: AddNewConfig;
  onSelectItem?: (item: FkOption | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<FkOption | null>(initialItem);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [options, setOptions] = useState<FkOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for async catalog fetch
    setLoading(true);
    search(debouncedQuery)
      .then((items) => {
        if (!active) return;
        setOptions(items);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debouncedQuery]);

  function choose(item: FkOption | null) {
    setSelected(item);
    field.handleChange(item?.id ?? '');
    onSelectItem?.(item);
  }

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <div className="flex items-end gap-2">
      <Field className="min-w-0 flex-1">
        <FieldLabel>{label}</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={isInvalid}
              className="w-full justify-between font-normal"
            >
              <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                {selected?.label ?? placeholder}
              </span>
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput value={query} onValueChange={setQuery} placeholder={placeholder} />
              <CommandList>
                <CommandEmpty>
                  {loading ? (
                    <span className="text-muted-foreground flex items-center justify-center gap-2 py-1 text-sm">
                      <Loader2 className="size-3.5 animate-spin" />
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.id}
                      value={opt.id}
                      onSelect={() => {
                        choose(opt);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(selected?.id === opt.id ? 'opacity-100' : 'opacity-0')}
                      />
                      <span className="truncate">{opt.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </Field>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={addNewLabel}
        title={addNewLabel}
        onClick={() => {
          setDialogOpen(true);
        }}
      >
        <Plus />
      </Button>

      <AddNewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={addNew}
        onCreated={choose}
      />
    </div>
  );
}
