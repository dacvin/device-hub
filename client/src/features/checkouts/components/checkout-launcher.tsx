'use client';

import { useEffect, useState } from 'react';

import { Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getPaginatedDevices } from '@/features/devices/api/get-paginated-devices';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { useDeviceLoanStatus } from '../api/get-device-loan-status';
import { CheckoutDialog } from './checkout-dialog';

type PickedDevice = { id: string; code: string; name: string };

// Searches devices eligible for checkout (storage-only policy) — availability
// is enforced afterwards by CheckoutDialog via device_loan_status.
function DevicePickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (device: PickedDevice) => void;
}) {
  const t = useTranslations('checkouts');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [options, setOptions] = useState<PickedDevice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for async device fetch
    setLoading(true);
    getPaginatedDevices({ q: debouncedQuery, status: 'storage', limit: 20 })
      .then(({ items }) => {
        if (!active) return;
        setOptions(items.map((d) => ({ id: d.id, code: d.code, name: d.name })));
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, debouncedQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pickDeviceTitle')}</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false} className="rounded-md border">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t('pickDevicePlaceholder')}
          />
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
              {options.map((d) => (
                <CommandItem
                  key={d.id}
                  value={d.id}
                  onSelect={() => {
                    onPick(d);
                  }}
                >
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {d.code}
                  </span>
                  <span className="truncate">{d.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// Page-level "Check out" entry point: pick a storage device, then hand off to
// the standard CheckoutDialog once its loan status (available count) is in.
export function CheckoutLauncher() {
  const t = useTranslations('checkouts');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [device, setDevice] = useState<PickedDevice | null>(null);
  const { data: loanStatus } = useDeviceLoanStatus(device?.id);

  return (
    <>
      <Button
        size="lg"
        onClick={() => {
          setPickerOpen(true);
        }}
      >
        <Plus />
        {t('checkOut')}
      </Button>

      <DevicePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(d) => {
          setPickerOpen(false);
          setDevice(d);
        }}
      />

      {device && loanStatus && (
        <CheckoutDialog
          deviceId={device.id}
          deviceName={device.name}
          available={loanStatus.available}
          open
          onOpenChange={(open) => {
            if (!open) setDevice(null);
          }}
        />
      )}
    </>
  );
}
