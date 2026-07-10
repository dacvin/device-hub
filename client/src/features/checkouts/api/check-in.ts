import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getDeviceQueryOptions } from '@/features/devices/api/get-device';
import { getDevicesQueryOptions } from '@/features/devices/api/get-paginated-devices';
import { toDbDescriptor } from '@/features/devices/api/media-descriptor';
import { createClient } from '@/lib/supabase/client';
import type { MediaEntry } from '@/features/devices/components/use-device-media';
import type { MutationConfig } from '@/lib/react-query';

import { checkInFormSchema, type CheckInFormValues } from '../validations/checkout';
import { commitCheckoutPhotos } from './checkout-media';
import { getCheckoutsQueryOptions } from './get-checkouts';

export const checkIn = async (args: {
  checkoutId: string;
  deviceId: string; // for cache invalidation
  values: CheckInFormValues;
  photos: MediaEntry[];
}): Promise<void> => {
  const supabase = createClient();
  const v = checkInFormSchema.parse(args.values);

  const descriptors =
    args.photos.length > 0
      ? await commitCheckoutPhotos(`${args.checkoutId}/checkins`, args.photos)
      : [];

  const { error } = await supabase.rpc('check_in', {
    p_checkout_id: args.checkoutId,
    p_outcome: v.outcome,
    p_quantity: v.quantity,
    p_condition: v.outcome === 'normal' && v.condition !== '' ? v.condition : undefined,
    p_photos: descriptors.map(toDbDescriptor),
    p_notes: v.notes || undefined,
    p_split: v.outcome === 'normal' && v.split,
    p_split_code: v.splitCode || undefined,
  });
  if (error) throw error;
};

type Options = { mutationConfig?: MutationConfig<typeof checkIn> };

export const useCheckIn = ({ mutationConfig }: Options = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};
  return useMutation({
    mutationFn: checkIn,
    onSuccess: (...a) => {
      queryClient.invalidateQueries({ queryKey: getCheckoutsQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getDeviceQueryOptions(a[1].deviceId).queryKey });
      onSuccess?.(...a);
    },
    ...rest,
  });
};
