# API examples — Infinite query (keyset)

For infinite scroll / "load more".

**Data flow:**

- **In** (params): raw → Zod (validate + defaults) → typed params.
- **Out** (page): snake_case rows → `camelcaseKeys` → `DeviceListItem[]`. Cursor reads camelCase `createdAt`/`id`, interpolated back into snake_case filters.

## Why keyset (not offset)

Offset (`.range`) skips+discards rows on deep pages and **shifts** when rows are inserted/deleted mid-scroll → duplicates or gaps. Keyset anchors each page to the last row's sort value → stable and fast at any depth. Cost: next/prev only (no jump-to-page) — exactly the infinite-scroll UX.

## Code

```ts
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import camelcaseKeys from 'camelcase-keys';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/client';

import { DeviceStatuses } from '../constants/device';

import type { DeviceListItem } from '../types/device';

type DeviceCursor = { createdAt: string; id: string };

const infiniteParamsSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).catch(20),
  status: z.union([z.enum(DeviceStatuses), z.array(z.enum(DeviceStatuses))])
    .transform((v) => (Array.isArray(v) ? v : [v])).optional().catch(undefined),
  q: z.string().trim().min(1).optional().catch(undefined),
});

type DeviceInfiniteParams = z.infer<typeof infiniteParamsSchema>;

export const getDevicesInfinite = async (
  { cursor, params }: { cursor: DeviceCursor | null; params: DeviceInfiniteParams },
): Promise<DeviceListItem[]> => {
  const supabase = createClient();
  let query = supabase
    .from('devices')
    .select('id, code, name, status, group_id, created_at')
    .is('deleted_at', null);

  if (params.status?.length) query = query.in('status', params.status);
  if (params.q) query = query.ilike('name', `%${params.q}%`);
  if (cursor) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(params.limit);

  if (error) throw error;

  return camelcaseKeys(data);
};

export const getDevicesInfiniteQueryOptions = (params: Record<string, unknown> = {}) => {
  const parsed = infiniteParamsSchema.parse(params);
  return infiniteQueryOptions({
    queryKey: ['devices', parsed],
    queryFn: ({ pageParam }) => getDevicesInfinite({ cursor: pageParam, params: parsed }),
    initialPageParam: null as DeviceCursor | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < parsed.limit) return undefined;
      const last = lastPage.at(-1);
      return last ? { createdAt: last.createdAt, id: last.id } : undefined;
    },
  });
};

export const useDevicesInfinite = ({ params = {} }: { params?: Record<string, unknown> } = {}) =>
  useInfiniteQuery(getDevicesInfiniteQueryOptions(params));
```

## Cursor & paging

- **Composite cursor `(createdAt, id)`** — `created_at` isn't unique, so `id` is the tiebreak; both compared as a total order. The `.or(...)` expresses `(created_at < X) OR (created_at = X AND id < Y)` — PostgREST has no native row-value comparison, so this is the idiom.
- **Sort is fixed** to the cursor columns — keyset can't take an arbitrary sort (each would need its own cursor). Need arbitrary multi-column sort *and* infinite scroll? Use offset (paginated) instead.
- `getNextPageParam` returns `undefined` on a short page (fewer than `limit`) → TanStack stops.
- Filters (`.in`/`.ilike`) are allowed and go in the `queryKey`; they narrow the set, the cursor still works.
- Consumers flatten pages: `const rows = query.data?.pages.flat() ?? []`.
