# API examples — Mutations (insert / update)

**Data flow:**

- **In:** `camelCase` payload → Zod validate (strips unknown fields) → `snakecaseKeys` → `insert`/`update`.
- **Out:** returned snake_case row → `camelcaseKeys` → `Device`.

Validate *before* converting; the typed `insert()/update()` still enforces the DB contract after conversion.

## Insert

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { DeviceStatuses } from '../constants/device';
import { getDevicesQueryOptions } from './get-devices';

import type { Device, DeviceInsert } from '../types/device';
import type { CreateDeviceFormValues } from '../validations/device';

const deviceInsertSchema = z.object({
  code: z.string(),
  name: z.string(),
  status: z.enum(DeviceStatuses),
  groupId: z.uuid(),
  unitId: z.uuid(),
  manufacturerId: z.uuid(),
}) satisfies z.ZodType<DeviceInsert>;

export const createDevice = async (input: CreateDeviceFormValues): Promise<Device> => {
  const supabase = createClient();

  const values = deviceInsertSchema.parse(input);
  const { data, error } = await supabase
    .from('devices')
    .insert(snakecaseKeys(values))
    .select()
    .single();

  if (error) throw error;

  return camelcaseKeys(data);
};

type UseCreateDeviceOptions = {
  mutationConfig?: MutationConfig<typeof createDevice>;
};

export const useCreateDevice = ({ mutationConfig }: UseCreateDeviceOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: createDevice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
```

- **Allowed fields only** — omitting `id`/timestamps means the DB assigns them; Zod strips them if a caller sneaks them in.
- **`satisfies z.ZodType<DeviceInsert>`** — a compile error here is your early warning that the DB schema changed.
- On success, **invalidate** the affected list queries so they refetch.

## Update (partial)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/client';
import type { MutationConfig } from '@/lib/react-query';

import { DeviceStatuses } from '../constants/device';
import { getDevicesQueryOptions } from './get-devices';

import type { Device, DeviceUpdate } from '../types/device';
import type { UpdateDeviceFormValues } from '../validations/device';

const deviceUpdateSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(DeviceStatuses).optional(),
  groupId: z.uuid().optional(),
  unitId: z.uuid().optional(),
  manufacturerId: z.uuid().optional(),
}) satisfies z.ZodType<DeviceUpdate>;

export const updateDevice = async ({
  deviceId,
  data,
}: {
  deviceId: string;
  data: UpdateDeviceFormValues;
}): Promise<Device> => {
  const supabase = createClient();

  const values = deviceUpdateSchema.parse(data);
  const { data: row, error } = await supabase
    .from('devices')
    .update(snakecaseKeys(values))
    .eq('id', deviceId)
    .select()
    .single();

  if (error) throw error;

  return camelcaseKeys(row);
};

type UseUpdateDeviceOptions = {
  mutationConfig?: MutationConfig<typeof updateDevice>;
};

export const useUpdateDevice = ({ mutationConfig }: UseUpdateDeviceOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: updateDevice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getDevicesQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
```

- Every field **optional** — the form schema is `createDeviceFormSchema.partial()`.
- `.update(values).eq('id', deviceId)` — never update without a filter.
- **One `invalidateQueries({ queryKey: ['devices'] })` is enough** — `invalidateQueries` matches by key *prefix*, so it refetches the lists, paginated, infinite, *and* this device's `['devices', id]` detail. No separate detail invalidation needed (same as insert).
