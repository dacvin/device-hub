# Client-side data fetching — design

**Date:** 2026-06-13
**Status:** Draft for review

## Goal

Move all page data fetching from server components + server actions to the browser using TanStack Query, so navigation feels instant on revisit (cache hit + background refetch) and pages no longer block on a server roundtrip per nav.

Page appearance does not change. The only visual addition is a per-page loading skeleton that matches the final layout while the first fetch resolves.

## Non-goals

- Realtime subscriptions.
- Optimistic updates (per-mutation, can be added later as needed).
- Prefetching from the server layout (would re-introduce server fetching).
- React Query Suspense mode — we use `isPending` directly.
- Refactors unrelated to the data layer (page composition, styling, component APIs).

## Current state (for context)

- App Router with `app/(app)/layout.tsx` doing the session check.
- All eleven pages under `(app)/` are `async` server components calling `lib/data/*.ts` (which is `"server-only"` and uses `@/lib/supabase/server`).
- Mutations live in six `_actions.ts` files: `settings`, `departments`, `groups`, `members`, `manufacturers`, `devices`.
- TanStack Query provider exists (`lib/react-query/providers.tsx`) but no hooks use it yet.
- Browser Supabase client already wired (`lib/supabase/client.ts`).

## Architecture

### 1. Server-side auth gate is preserved

`app/(app)/layout.tsx` stays a server component. It still calls `supabase.auth.getUser()` and `redirect("/login")` on a missing session. No flash-of-nothing. Everything under it becomes client.

### 2. Bulletproof-react feature folders

Each domain owns its API + hooks:

```
client/src/features/
  devices/
    api/
      get-devices.ts          # listDevices(filters): Promise<DeviceWithFlags[]>
      get-device.ts           # getDeviceWithFlagsByCode(code)
      create-device.ts        # createDevice(values)
      update-device.ts        # updateDevice(id, values)
      delete-device.ts        # deleteDevice(id)
      bulk-update-status.ts   # bulkUpdateStatus(ids, status)
      ... (one file per operation)
    hooks/
      use-devices.ts          # useQuery wrapper
      use-device.ts
      use-create-device.ts    # useMutation wrapper
      use-update-device.ts
      use-delete-device.ts
      use-bulk-update-status.ts
  groups/        { api/, hooks/ }
  departments/   { api/, hooks/ }
  manufacturers/ { api/, hooks/ }
  members/       { api/, hooks/ }
  settings/      { api/, hooks/ }
  activity/      { api/, hooks/ }
```

Convention:
- `api/<verb>-<noun>.ts` exports a single async function. No `"server-only"`. Uses `@/lib/supabase/client`.
- `hooks/use-<thing>.ts` wraps it in `useQuery` or `useMutation`.
- One operation per file (matches bulletproof-react).

### 3. Central query-key factory

`client/src/lib/queries/keys.ts`:

```ts
export const queryKeys = {
  devices: {
    all: ["devices"] as const,
    list: (filters: DeviceListFilters) => ["devices", "list", filters] as const,
    byCode: (code: string) => ["devices", "by-code", code] as const,
  },
  groups: { all: ["groups"] as const },
  departments: { all: ["departments"] as const },
  manufacturers: { all: ["manufacturers"] as const },
  members: {
    all: ["members"] as const,
    byId: (id: string) => ["members", id] as const,
  },
  orgSettings: ["org-settings"] as const,
  activity: (limit: number) => ["activity", limit] as const,
};
```

All hooks import keys from here. No stringly-typed keys at call sites.

### 4. Migration of existing data functions

`client/src/lib/data/*.ts` is split per operation into `features/<domain>/api/*.ts`:

- Remove `import "server-only"`.
- Replace `import { createClient } from "@/lib/supabase/server"` with `@/lib/supabase/client`.
- Replace `const supabase = await createClient()` with `const supabase = createClient()` (browser client is sync).
- Keep the function body identical — same filters, same shape, same mappers from `@/lib/domain/*`.

Exception: `lib/data/auth.ts` stays where it is. The server layout still needs `getCurrentMember()` for the auth gate.

After migration, delete the old `lib/data/<domain>.ts` files (except `auth.ts`).

### 5. Mutations: direct to Supabase, server actions deleted

All six `_actions.ts` files are removed. Components that call them today switch to the new mutation hooks.

A typical mutation hook:

```ts
export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDevice, // from features/devices/api/create-device.ts
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success(t("created"));
    },
    onError: (e) => toast.error(e.message),
  });
}
```

RLS in Postgres is the sole authorization layer for these calls (already true for reads).

### 6. Pages become client components

Each `(app)/<route>/page.tsx`:

- Add `"use client"` at the top.
- Remove `async` and the `await` data fetches.
- Replace each `await listX()` with a hook call.
- Remove `await getCurrentMember()` / `redirect("/login")` (the layout handles auth).
- Replace `await getTranslations(...)` with `useTranslations(...)`.
- Wrap the existing JSX (unchanged) in a guard: if any query `isPending`, render the skeleton; otherwise render the page exactly as today.

Derived computations that today run inline in the server component (e.g. overview's KPI math, group-share rollup) move into `select` callbacks on the relevant `useQuery` so they recompute only when the source data changes.

For the devices page (URL-driven filters): replace the current server-side `searchParams` reading with `useSearchParams()`, then `useDevices(filtersFromUrl)`.

### 7. Loading UX

Per page, a skeleton component lives next to it (e.g. `(app)/overview/_components/page-skeleton.tsx`) and mirrors the final layout's box positions so there is no shift when data arrives.

Errors render an inline card with a Retry button bound to `query.refetch()`. No global error boundary changes.

Mutations:
- `toast.loading` → `toast.success` / `toast.error`.
- Invalidate the relevant key(s) in `onSuccess`.

## Data flow example — overview page

1. User navigates to `/overview`.
2. `(app)/layout.tsx` (server) validates session, renders shell.
3. `overview/page.tsx` mounts on client. Three queries fire in parallel: `useDevices()`, `useGroups()`, `useRecentActivity(5)`.
4. While any is `isPending`, the page renders the overview skeleton.
5. As queries resolve, the existing overview JSX renders unchanged. KPI numbers, lifecycle segments, group-share rows, and the attention rail are derived via `select`.
6. On the user's next visit to `/overview` within `staleTime`, the cache renders the page instantly while a background refetch runs.

## File-by-file change summary

| Path | Action |
| --- | --- |
| `client/src/lib/data/devices.ts` | Split into `features/devices/api/*.ts`, then delete |
| `client/src/lib/data/groups.ts` | Same |
| `client/src/lib/data/departments.ts` | Same |
| `client/src/lib/data/manufacturers.ts` | Same |
| `client/src/lib/data/members.ts` | Same |
| `client/src/lib/data/settings.ts` | Same |
| `client/src/lib/data/activity.ts` | Same |
| `client/src/lib/data/storage.ts` | Move to `features/devices/api/` if device-scoped; otherwise to a shared location |
| `client/src/lib/data/_filter.ts` | Move to `client/src/lib/queries/_filter.ts` (still shared util) |
| `client/src/lib/data/auth.ts` | **Stays** — server layout still uses it |
| `client/src/lib/queries/keys.ts` | **New** — query-key factory |
| `client/src/features/<domain>/api/*.ts` | **New** — one file per operation |
| `client/src/features/<domain>/hooks/*.ts` | **New** — one file per query/mutation |
| `client/src/app/(app)/<route>/page.tsx` | Convert to `"use client"`, swap to hooks, add skeleton guard |
| `client/src/app/(app)/<route>/_components/page-skeleton.tsx` | **New** per page |
| `client/src/app/(app)/settings/_actions.ts` | **Deleted** |
| `client/src/app/(app)/departments/_actions.ts` | **Deleted** |
| `client/src/app/(app)/groups/_actions.ts` | **Deleted** |
| `client/src/app/(app)/manufacturers/_actions.ts` | **Deleted** |
| `client/src/app/(app)/members/_actions.ts` | **Deleted** |
| `client/src/app/(app)/devices/_actions.ts` | **Deleted** |
| `client/src/app/(app)/layout.tsx` | **Unchanged** |
| `client/src/lib/react-query/providers.tsx` | **Unchanged** |
| `client/src/lib/supabase/server.ts` | **Stays** — used by layout + middleware |

## QueryClient defaults

`lib/react-query/get-query-client.ts` stays close to its current shape. Suggested defaults:

- `staleTime: 30_000` — covers typical revisit windows and avoids hammering Supabase on quick back-nav.
- `gcTime: 5 * 60_000`.
- `refetchOnWindowFocus: true` for queries; mutations untouched.

(Final numbers can be tuned in the plan; they are not load-bearing for this spec.)

## Risks and tradeoffs

- **Cold first paint is slower than today's SSR.** Accepted tradeoff for instant subsequent navigation.
- **Surface area exposed to the browser grows.** All reads + writes go through the anon-key client; RLS policies must cover every table currently touched by `_actions.ts`. The plan must include a verification pass.
- **Clean break, no compatibility shims.** Once `_actions.ts` files are deleted, there is no server entry point for mutations.
- **URL-driven filters on devices** move from server `searchParams` to `useSearchParams()`. Same UX, different read site.
- **i18n flip:** every page swaps `getTranslations` (async, server) for `useTranslations` (sync, client). Mechanical but must not be missed.

## Success criteria

- No page under `(app)/` is an `async` server component (except `layout.tsx`).
- No `_actions.ts` files remain.
- No `import "server-only"` remains outside of `lib/data/auth.ts`, `lib/supabase/server.ts`, and the layout's auth path.
- Every page renders its existing JSX unchanged once data loads. Visual diff on populated state is zero.
- Every page shows a skeleton on first load and on cache miss.
- Mutations invalidate the right keys and refresh affected lists without a full nav.
- Auth gating still happens server-side: hitting any `(app)/` route while signed out redirects to `/login` before any client JS runs.
