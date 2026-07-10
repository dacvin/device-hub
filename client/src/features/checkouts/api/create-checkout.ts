import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getDeviceQueryOptions } from '@/features/devices/api/get-device';
import { getDevicesQueryOptions } from '@/features/devices/api/get-paginated-devices';
import { toDbDescriptor } from '@/features/devices/api/media-descriptor';
import { createClient } from '@/lib/supabase/client';
import type { MediaEntry } from '@/features/devices/components/use-device-media';
import type { MutationConfig } from '@/lib/react-query';

import { checkoutFormSchema, type CheckoutFormValues } from '../validations/checkout';
import { commitCheckoutPhotos } from './checkout-media';
import { getCheckoutsQueryOptions } from './get-checkouts';

export const createCheckout = async (args: {
  deviceId: string;
  values: CheckoutFormValues;
  photos: MediaEntry[];
}): Promise<string> => {
  const supabase = createClient();
  const v = checkoutFormSchema.parse(args.values);

  // 1. insert the checkout (checked_out_by / checked_out_at filled by DB defaults)
  const { data, error } = await supabase
    .from('checkouts')
    .insert({
      device_id: args.deviceId,
      borrower_name: v.borrowerName,
      quantity: v.quantity,
      expected_return_date: v.expectedReturnDate || null,
      notes: v.notes || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  const checkoutId = data.id;

  // 2. upload photos under the checkout id, then patch the row
  if (args.photos.length > 0) {
    const descriptors = await commitCheckoutPhotos(checkoutId, args.photos);
    const { error: upErr } = await supabase
      .from('checkouts')
      .update({ photos: descriptors.map(toDbDescriptor) })
      .eq('id', checkoutId);
    if (upErr) throw upErr;
  }
  return checkoutId;
};

type Options = { mutationConfig?: MutationConfig<typeof createCheckout> };

export const useCreateCheckout = ({ mutationConfig }: Options = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: createCheckout,
    onSuccess: (...a) => {
      queryClient.invalidateQueries({ queryKey: getCheckoutsQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getDeviceQueryOptions(a[1].deviceId).queryKey });
      onSuccess?.(...a);
    },
    ...rest,
  });
};
