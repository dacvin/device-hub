# API examples — Queries (get / list / paginated)

**Data flow:**

- **In** (params): raw query strings → Zod (validate + defaults) → typed params.
- **Out:** snake_case rows → `camelcaseKeys` → `Device` (detail) / `DeviceListItem` (lists). No response Zod — the typed client is the contract.

Reads exclude soft-deleted rows (`.is('deleted_at', null)`).

## Get one (parameterized)

```ts
import { queryOptions, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import type { Device } from '../types/device';

export const getDevice = async (deviceId: string): Promise<Device> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('id', deviceId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  return camelcaseKeys(data);
};

export const getDeviceQueryOptions = (deviceId: string) =>
  queryOptions({
    queryKey: ['devices', deviceId],
    queryFn: () => getDevice(deviceId),
  });

type UseDeviceOptions = {
  deviceId: string;
  queryConfig?: QueryConfig<typeof getDeviceQueryOptions>;
};

export const useDevice = ({ deviceId, queryConfig }: UseDeviceOptions) =>
  useQuery({
    ...getDeviceQueryOptions(deviceId),
    ...queryConfig,
  });
```

- The id goes in **both** the fetcher args and the `queryKey`.
- **Three exports per file:** the fetcher, a `queryOptions` factory (single source of key + fetcher, enables prefetch), and a `use*` hook (spreads the options, merges `queryConfig`).
- If the id can be `undefined` on first render, see *Dependent / waterfall query*.

## Dependent / waterfall query (id not ready yet)

The id isn't known on first render — it comes from an earlier query or a route param — so the query must stay **idle until the id resolves**, then run.

Three edits to *Get one* (import `skipToken`); `getDevice` and the consumer stay the same.

**1. The options** — widen the id and gate with `skipToken`:

```ts
export const getDeviceQueryOptions = (deviceId: string | undefined) =>
  queryOptions({
    queryKey: ['devices', deviceId],
    queryFn: deviceId ? () => getDevice(deviceId) : skipToken,
  });
```

`skipToken` disables the query and keeps types honest (no `deviceId!`). While skipped, `data` is `undefined` — show a spinner off `isLoading`, not `isPending`.

**2. The type** — widen `deviceId` to match:

```ts
type UseDeviceOptions = {
  deviceId: string | undefined;
  queryConfig?: QueryConfig<typeof getDeviceQueryOptions>;
};
```

**3. The hook** — force the query off while the id is missing (`skipToken` + a truthy `enabled` throws `Missing queryFn`, [#7057](https://github.com/TanStack/query/issues/7057)):

```ts
export const useDevice = ({ deviceId, queryConfig }: UseDeviceOptions) =>
  useQuery({
    ...getDeviceQueryOptions(deviceId),
    ...queryConfig,
    ...(deviceId ? {} : { enabled: false }),
  });
```

Once the id lands the caller's `enabled` (boolean or function) applies untouched. Don't fold `enabled` into the queryKey (`getDeviceQueryOptions(enabled && deviceId)`) — the key is identity, `enabled` is execution.

## Get list

```ts
import { queryOptions, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import type { DeviceListItem } from '../types/device';

export const getDevices = async (): Promise<DeviceListItem[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('devices')
    .select('id, code, name, status, group_id, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return camelcaseKeys(data);
};

export const getDevicesQueryOptions = () =>
  queryOptions({
    queryKey: ['devices'],
    queryFn: getDevices,
  });

type UseDevicesOptions = {
  queryConfig?: QueryConfig<typeof getDevicesQueryOptions>;
};

export const useDevices = ({ queryConfig }: UseDevicesOptions = {}) =>
  useQuery({
    ...getDevicesQueryOptions(),
    ...queryConfig,
  });
```

- Select only the columns you need — the typed client narrows `data`; `camelcaseKeys` converts.
- The bare `['devices']` key is the **invalidation prefix**: mutations invalidate `['devices']` and every `['devices', …]` entry refetches.

## Get paginated — offset (page-number UI)

Pagination *and* filters arrive as query params (strings, maybe missing). Declare every param in one schema with fallbacks (pagination → defaults, filters → "not applied"), then apply them. Sort columns are **whitelisted** (never `order()` raw user input).

```ts
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/client';
import type { QueryConfig } from '@/lib/react-query';

import { DeviceStatuses } from '../constants/device';

import type { DeviceListItem } from '../types/device';

const SORTABLE_COLUMNS = ['created_at', 'name', 'code', 'status'] as const;

const sortSchema = z
  .string()
  .transform((v) => v.split(',').map((p) => p.trim()).filter(Boolean).map((p) => {
    const [column, direction] = p.split('.');
    return { column, ascending: direction !== 'desc' };
  }))
  .pipe(z.array(z.object({ column: z.enum(SORTABLE_COLUMNS), ascending: z.boolean() })).min(1))
  .catch([{ column: 'created_at', ascending: false }]);

const listParamsSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(20),
  status: z.union([z.enum(DeviceStatuses), z.array(z.enum(DeviceStatuses))])
    .transform((v) => (Array.isArray(v) ? v : [v])).optional().catch(undefined),
  q: z.string().trim().min(1).optional().catch(undefined),
  sort: sortSchema,
});

type DeviceListParams = z.infer<typeof listParamsSchema>;

export const getPaginatedDevices = async ({
  page,
  limit,
  status,
  q,
  sort,
}: DeviceListParams): Promise<{
  items: DeviceListItem[];
  total: number;
  page: number;
  limit: number;
}> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createClient();

  let query = supabase
    .from('devices')
    .select('id, code, name, status, group_id, created_at', { count: 'exact' })
    .is('deleted_at', null);

  if (status?.length) query = query.in('status', status);
  if (q) query = query.ilike('name', `%${q}%`);
  for (const { column, ascending } of sort) query = query.order(column, { ascending });

  const { data, count, error } = await query.range(from, to);

  if (error) throw error;

  return { items: camelcaseKeys(data), total: count ?? 0, page, limit };
};

export const getPaginatedDevicesQueryOptions = (params: Record<string, unknown> = {}) => {
  const parsed = listParamsSchema.parse(params);
  return queryOptions({
    queryKey: ['devices', parsed],
    queryFn: () => getPaginatedDevices(parsed),
    placeholderData: keepPreviousData,
  });
};

type UsePaginatedDevicesOptions = {
  params: Record<string, unknown>;
  queryConfig?: QueryConfig<typeof getPaginatedDevicesQueryOptions>;
};

export const usePaginatedDevices = ({ params, queryConfig }: UsePaginatedDevicesOptions) =>
  useQuery({
    ...getPaginatedDevicesQueryOptions(params),
    ...queryConfig,
  });
```

- All params validated with fallbacks; `q` → single-column `.ilike` (multi-column needs `.or()` w/ escaping); `sort` → multi-field, whitelisted. Filters/sort go **before** `range`.
- **queryKey includes every param** → each combo is its own cache entry; `keepPreviousData` avoids flashes when paging.
- **Offset** (`.range` + `count: 'exact'`) gives `total` for "page N of M". Deep pages scan+discard and shift under writes → for endless scroll use **keyset** (`infinite-query.md`).
