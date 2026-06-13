# Client-side data fetching — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every page's data fetching from server components + server actions to the browser using TanStack Query, so navigation feels instant on revisit. Page appearance does not change; only addition is a loading skeleton.

**Architecture:** `app/(app)/layout.tsx` keeps server-side auth gating. Every page under it becomes a `"use client"` component that calls `useQuery`/`useMutation` hooks. Hooks live in `features/<domain>/hooks/`; raw Supabase queries (one operation per file) live in `features/<domain>/api/`. RLS authorizes all browser-side reads and writes. All six `_actions.ts` files get deleted.

**Tech Stack:** Next.js App Router, TanStack Query v5, `@supabase/ssr` browser client, next-intl client hooks, sonner toasts.

**Spec:** `docs/superpowers/specs/2026-06-13-client-side-data-fetching-design.md`

**Notes:**

- No automated tests exist in this project. Verification per task is: `pnpm --filter client build` succeeds, then `pnpm --filter client dev` and exercise the page in a browser. Each task documents a smoke-test checklist.
- Each task ends with a commit, so the tree stays bisectable.
- `lib/data/auth.ts` stays untouched — it's used by `app/(app)/layout.tsx` (server) for the gate.
- After every page is migrated, Task 11 deletes the orphaned `lib/data/*.ts` files in one sweep.
- Always run commands from the repo root unless noted.

---

## Task 1: Query-key factory + scaffold

**Files:**
- Create: `client/src/lib/queries/keys.ts`
- Create: `client/src/lib/queries/_filter.ts` (moved from `lib/data/_filter.ts`)
- Create: `client/src/features/.gitkeep`

- [ ] **Step 1: Create the query-key factory**

Write `client/src/lib/queries/keys.ts`:

```ts
import type { DeviceListFilters } from "@/features/devices/api/get-devices";
import type { MemberListFilters } from "@/features/members/api/get-members";

export const queryKeys = {
  devices: {
    all: ["devices"] as const,
    list: (filters: DeviceListFilters) => ["devices", "list", filters] as const,
    byCode: (code: string) => ["devices", "by-code", code] as const,
    byId: (id: string) => ["devices", "by-id", id] as const,
    photos: (deviceId: string) => ["devices", deviceId, "photos"] as const,
    documents: (deviceId: string) => ["devices", deviceId, "documents"] as const,
  },
  groups: {
    all: ["groups"] as const,
    withCounts: ["groups", "with-counts"] as const,
    byId: (id: string) => ["groups", "by-id", id] as const,
  },
  departments: {
    all: ["departments"] as const,
    withCounts: ["departments", "with-counts"] as const,
    byId: (id: string) => ["departments", "by-id", id] as const,
  },
  manufacturers: {
    all: ["manufacturers"] as const,
    withCounts: ["manufacturers", "with-counts"] as const,
    byId: (id: string) => ["manufacturers", "by-id", id] as const,
  },
  members: {
    all: ["members"] as const,
    list: (filters: MemberListFilters) => ["members", "list", filters] as const,
    byId: (id: string) => ["members", "by-id", id] as const,
    deviceCount: (departmentId: string | null) => ["members", "device-count", departmentId] as const,
  },
  orgSettings: ["org-settings"] as const,
  userPreference: (userId: string) => ["user-preference", userId] as const,
  activity: {
    recent: (limit: number) => ["activity", "recent", limit] as const,
    byActor: (actorId: string, limit: number) => ["activity", "by-actor", actorId, limit] as const,
    byEntity: (entityType: string, entityId: string, limit: number) =>
      ["activity", "by-entity", entityType, entityId, limit] as const,
  },
  storage: {
    photoUrls: (paths: string[]) => ["storage", "photo-urls", paths] as const,
    documentUrls: (paths: string[]) => ["storage", "document-urls", paths] as const,
  },
} as const;
```

The two type imports from `@/features/.../api/...` won't resolve yet — those files arrive in later tasks. Leaving them here keeps the keys file colocated and avoids edits when the imports become valid.

- [ ] **Step 2: Move the PostgREST filter helper**

Copy `client/src/lib/data/_filter.ts` to `client/src/lib/queries/_filter.ts` (identical contents). Do **not** delete the old one yet — `lib/data/devices.ts` and `lib/data/members.ts` still import it. They'll be deleted in Task 11.

```ts
// client/src/lib/queries/_filter.ts
/**
 * Escape user input destined for a PostgREST `.or()` filter string.
 */
export function escapePostgrestFilter(term: string): string {
  return term.replace(/[\\,()]/g, (c) => `\\${c}`);
}
```

- [ ] **Step 3: Create empty features dir**

```bash
mkdir -p client/src/features && touch client/src/features/.gitkeep
```

- [ ] **Step 4: Verify build still passes**

The new `keys.ts` references types that don't exist yet, so it would not compile in isolation. To keep the tree green, **don't import `keys.ts` from anything yet**. Confirm:

```bash
pnpm --filter client build
```

Expected: build succeeds (nothing imports the new files).

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/queries/keys.ts client/src/lib/queries/_filter.ts client/src/features/.gitkeep
git commit -m "feat(query): scaffold query keys factory and features dir"
```

---

## Task 2: Activity logger (browser) + activity feature

**Files:**
- Create: `client/src/features/activity/api/log-activity.ts`
- Create: `client/src/features/activity/api/list-recent-activity.ts`
- Create: `client/src/features/activity/api/list-activity-by-actor.ts`
- Create: `client/src/features/activity/api/list-activity-for-entity.ts`
- Create: `client/src/features/activity/hooks/use-recent-activity.ts`
- Create: `client/src/features/activity/hooks/use-activity-by-actor.ts`

- [ ] **Step 1: Add a browser `getCurrentMember` helper**

Mutations need the actor ID for activity logging. Create `client/src/features/auth/api/get-current-member.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { mapMemberRow, type Member, type MemberRow } from "@/lib/domain/members";

type MemberJoinedRow = MemberRow & {
  department: { name: string } | null;
  reports_to_member: { name: string } | null;
};

const memberSelect = `
  *,
  department:department_id(name),
  reports_to_member:reports_to(name)
`;

export async function getCurrentMember(): Promise<Member | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("member")
    .select(memberSelect)
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMemberRow(data as unknown as MemberJoinedRow) : null;
}
```

And `client/src/features/auth/hooks/use-current-member.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getCurrentMember } from "@/features/auth/api/get-current-member";

export function useCurrentMember() {
  return useQuery({
    queryKey: ["auth", "current-member"] as const,
    queryFn: getCurrentMember,
    staleTime: 5 * 60_000,
  });
}
```

- [ ] **Step 2: Browser activity logger**

`client/src/features/activity/api/log-activity.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { ActivityAction } from "@/lib/domain/activity";

export interface LogActivityInput {
  actorId: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string | null;
  entityLabel?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("activity").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    entity_label: input.entityLabel ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: (input.metadata ?? {}) as any,
  });
  if (error) console.error("logActivity failed", error);
}
```

- [ ] **Step 3: Activity read functions**

`client/src/features/activity/api/list-recent-activity.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Activity, mapActivityRow } from "@/lib/domain/activity";

const activitySelect = `*, actor:actor_id(name)`;

export async function listRecentActivity(limit = 5): Promise<Activity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}
```

`client/src/features/activity/api/list-activity-by-actor.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Activity, mapActivityRow } from "@/lib/domain/activity";

const activitySelect = `*, actor:actor_id(name)`;

export async function listActivityByActor(actorId: string, limit = 20): Promise<Activity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}
```

`client/src/features/activity/api/list-activity-for-entity.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Activity, mapActivityRow } from "@/lib/domain/activity";

const activitySelect = `*, actor:actor_id(name)`;

export async function listActivityForEntity(
  entityType: string,
  entityId: string,
  limit = 20,
): Promise<Activity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}
```

- [ ] **Step 4: Activity hooks**

`client/src/features/activity/hooks/use-recent-activity.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listRecentActivity } from "@/features/activity/api/list-recent-activity";
import { queryKeys } from "@/lib/queries/keys";

export function useRecentActivity(limit = 5) {
  return useQuery({
    queryKey: queryKeys.activity.recent(limit),
    queryFn: () => listRecentActivity(limit),
  });
}
```

`client/src/features/activity/hooks/use-activity-by-actor.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listActivityByActor } from "@/features/activity/api/list-activity-by-actor";
import { queryKeys } from "@/lib/queries/keys";

export function useActivityByActor(actorId: string, limit = 20) {
  return useQuery({
    queryKey: queryKeys.activity.byActor(actorId, limit),
    queryFn: () => listActivityByActor(actorId, limit),
    enabled: !!actorId,
  });
}
```

- [ ] **Step 5: Build**

```bash
pnpm --filter client build
```

Expected: success. New files compile; nothing imports them yet from pages.

- [ ] **Step 6: Commit**

```bash
git add client/src/features/auth client/src/features/activity
git commit -m "feat(features): browser-side auth + activity api and hooks"
```

---

## Task 3: features/groups + migrate `/groups`

**Files:**
- Create: `client/src/features/groups/api/{list-groups,list-groups-with-counts,get-group,create-group,update-group,delete-group}.ts`
- Create: `client/src/features/groups/hooks/{use-groups,use-groups-with-counts,use-save-group,use-delete-group}.ts`
- Create: `client/src/app/(app)/groups/_components/page-skeleton.tsx`
- Modify: `client/src/app/(app)/groups/page.tsx`
- Modify: `client/src/app/(app)/groups/_components/groups-client.tsx`
- Delete: `client/src/app/(app)/groups/_actions.ts`

- [ ] **Step 1: Read API files**

`client/src/features/groups/api/list-groups.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type DeviceGroup, mapGroupRow } from "@/lib/domain/devices";

export async function listGroups(): Promise<DeviceGroup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_group")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapGroupRow);
}
```

`client/src/features/groups/api/list-groups-with-counts.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type DeviceGroup, mapGroupRow } from "@/lib/domain/devices";

export interface GroupWithCount extends DeviceGroup {
  deviceCount: number;
}

export async function listGroupsWithCounts(): Promise<GroupWithCount[]> {
  const supabase = createClient();
  const [{ data: rows, error }, { data: counts, error: countErr }] = await Promise.all([
    supabase.from("device_group").select("*").order("name", { ascending: true }),
    supabase.from("device").select("group_id").is("deleted_at", null),
  ]);
  if (error) throw error;
  if (countErr) throw countErr;
  const tally = new Map<string, number>();
  for (const c of counts ?? []) {
    tally.set(c.group_id, (tally.get(c.group_id) ?? 0) + 1);
  }
  return (rows ?? []).map((r) => ({
    ...mapGroupRow(r),
    deviceCount: tally.get(r.id) ?? 0,
  }));
}
```

`client/src/features/groups/api/get-group.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type DeviceGroup, mapGroupRow } from "@/lib/domain/devices";

export async function getGroupById(id: string): Promise<DeviceGroup | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_group")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGroupRow(data) : null;
}
```

- [ ] **Step 2: Mutation API files**

`client/src/features/groups/api/create-group.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type DeviceGroup, type GroupFormValues, mapGroupRow } from "@/lib/domain/devices";

export async function createGroup(v: GroupFormValues): Promise<DeviceGroup> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_group")
    .insert({
      name: v.name,
      icon: v.icon || null,
      default_inventory_cycle_months: v.defaultInventoryCycleMonths,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapGroupRow(data);
}
```

`client/src/features/groups/api/update-group.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type DeviceGroup, type GroupFormValues, mapGroupRow } from "@/lib/domain/devices";

export async function updateGroup(id: string, v: GroupFormValues): Promise<DeviceGroup> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_group")
    .update({
      name: v.name,
      icon: v.icon || null,
      default_inventory_cycle_months: v.defaultInventoryCycleMonths,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapGroupRow(data);
}
```

`client/src/features/groups/api/delete-group.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function deleteGroup(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("device_group").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 3: Hooks**

`client/src/features/groups/hooks/use-groups.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listGroups } from "@/features/groups/api/list-groups";
import { queryKeys } from "@/lib/queries/keys";

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: listGroups,
  });
}
```

`client/src/features/groups/hooks/use-groups-with-counts.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listGroupsWithCounts } from "@/features/groups/api/list-groups-with-counts";
import { queryKeys } from "@/lib/queries/keys";

export function useGroupsWithCounts() {
  return useQuery({
    queryKey: queryKeys.groups.withCounts,
    queryFn: listGroupsWithCounts,
  });
}
```

`client/src/features/groups/hooks/use-save-group.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupFormSchema, type GroupFormValues } from "@/lib/domain/devices";
import { createGroup } from "@/features/groups/api/create-group";
import { updateGroup } from "@/features/groups/api/update-group";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: GroupFormValues }) => {
      const parsed = groupFormSchema.parse(values);
      const me = await getCurrentMember();
      const row = id ? await updateGroup(id, parsed) : await createGroup(parsed);
      await logActivity({
        actorId: me?.id ?? null,
        action: id ? "catalog.updated" : "catalog.created",
        entityType: "device_group",
        entityId: row.id,
        entityLabel: row.name,
      });
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      qc.invalidateQueries({ queryKey: queryKeys.groups.withCounts });
    },
  });
}
```

`client/src/features/groups/hooks/use-delete-group.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGroup } from "@/features/groups/api/delete-group";
import { getGroupById } from "@/features/groups/api/get-group";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const [row, me] = await Promise.all([getGroupById(id), getCurrentMember()]);
      await deleteGroup(id);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.deleted",
        entityType: "device_group",
        entityId: id,
        entityLabel: row?.name ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      qc.invalidateQueries({ queryKey: queryKeys.groups.withCounts });
    },
  });
}
```

- [ ] **Step 4: Page skeleton**

`client/src/app/(app)/groups/_components/page-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogPageShell } from "@/app/(app)/_components/catalog-page-shell";

export function GroupsPageSkeleton() {
  return (
    <CatalogPageShell
      title=""
      subtitle=""
      metaLine=""
      addLabel=""
      onAdd={() => {}}
      search=""
      onSearchChange={() => {}}
    >
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </CatalogPageShell>
  );
}
```

Check `@/components/ui/skeleton` exists:

```bash
ls client/src/components/ui/skeleton.tsx
```

If it doesn't, install via shadcn:

```bash
pnpm --filter client dlx shadcn@latest add skeleton
```

- [ ] **Step 5: Rewrite the page**

Replace `client/src/app/(app)/groups/page.tsx`:

```tsx
"use client";

import { useGroupsWithCounts } from "@/features/groups/hooks/use-groups-with-counts";
import { GroupsClient } from "./_components/groups-client";
import { GroupsPageSkeleton } from "./_components/page-skeleton";

export default function GroupsPage() {
  const { data: rows, isPending } = useGroupsWithCounts();
  if (isPending || !rows) return <GroupsPageSkeleton />;
  return <GroupsClient rows={rows} />;
}
```

- [ ] **Step 6: Switch the client component off of server actions**

In `client/src/app/(app)/groups/_components/groups-client.tsx`:

Find:
```tsx
import { deleteGroupAction, saveGroupAction } from "@/app/(app)/groups/_actions";
import type { GroupWithCount } from "@/lib/data/groups";
```

Replace with:
```tsx
import { useSaveGroup } from "@/features/groups/hooks/use-save-group";
import { useDeleteGroup } from "@/features/groups/hooks/use-delete-group";
import type { GroupWithCount } from "@/features/groups/api/list-groups-with-counts";
```

Inside `GroupsClient`, add at the top of the component:

```tsx
const saveGroup = useSaveGroup();
const deleteGroup = useDeleteGroup();
```

Replace the delete `onClick` body:

```tsx
onClick={() => {
  deleteGroup.mutate(r.id, {
    onError: (e) => toast.error(e instanceof Error ? e.message : tCommon("deleteFailed")),
  });
}}
```

Replace the `<GroupForm onSubmit=...>` body:

```tsx
onSubmit={async (values) => {
  try {
    await saveGroup.mutateAsync({ id: editing?.id ?? null, values });
    setOpenId(null);
    toast.success(editing ? t("updated") : t("added"));
  } catch (e) {
    toast.error(e instanceof Error ? e.message : tCommon("saveFailed"));
  }
}}
```

Delete the now-unused `useTransition` import and the `startTransition` block. Final unused imports to remove: `useTransition`.

- [ ] **Step 7: Delete the server actions file**

```bash
rm client/src/app/\(app\)/groups/_actions.ts
```

- [ ] **Step 8: Build + smoke test**

```bash
pnpm --filter client build
```

Then run dev and check:

```bash
pnpm --filter client dev
```

Open http://localhost:3000/groups:
- [ ] Skeleton flashes briefly on first load
- [ ] Group list populates and looks identical to before
- [ ] Add a test group → toast "added" → list updates without nav
- [ ] Edit it → toast "updated" → row reflects change
- [ ] Delete an empty group → row disappears
- [ ] Reload — verify nothing was lost

- [ ] **Step 9: Commit**

```bash
git add client/src/features/groups client/src/app/\(app\)/groups
git commit -m "feat(groups): migrate to client-side queries and mutations"
```

---

## Task 4: features/departments + migrate `/departments`

**Files:**
- Create: `client/src/features/departments/api/{list-departments,list-departments-with-counts,get-department,create-department,update-department,delete-department}.ts`
- Create: `client/src/features/departments/hooks/{use-departments,use-departments-with-counts,use-save-department,use-delete-department}.ts`
- Create: `client/src/app/(app)/departments/_components/page-skeleton.tsx`
- Modify: `client/src/app/(app)/departments/page.tsx`
- Modify: `client/src/app/(app)/departments/_components/departments-client.tsx`
- Delete: `client/src/app/(app)/departments/_actions.ts`

- [ ] **Step 1: Read API files**

`client/src/features/departments/api/list-departments.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Department, mapDepartmentRow } from "@/lib/domain/devices";

export async function listDepartments(): Promise<Department[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("department")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapDepartmentRow);
}
```

`client/src/features/departments/api/list-departments-with-counts.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Department, mapDepartmentRow } from "@/lib/domain/devices";

export interface DepartmentWithCount extends Department {
  deviceCount: number;
}

export async function listDepartmentsWithCounts(): Promise<DepartmentWithCount[]> {
  const supabase = createClient();
  const [{ data: rows, error }, { data: counts, error: countErr }] = await Promise.all([
    supabase.from("department").select("*").order("name", { ascending: true }),
    supabase.from("device").select("department_id").is("deleted_at", null),
  ]);
  if (error) throw error;
  if (countErr) throw countErr;
  const tally = new Map<string, number>();
  for (const c of counts ?? []) {
    tally.set(c.department_id, (tally.get(c.department_id) ?? 0) + 1);
  }
  return (rows ?? []).map((r) => ({
    ...mapDepartmentRow(r),
    deviceCount: tally.get(r.id) ?? 0,
  }));
}
```

`client/src/features/departments/api/get-department.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Department, mapDepartmentRow } from "@/lib/domain/devices";

export async function getDepartmentById(id: string): Promise<Department | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("department")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDepartmentRow(data) : null;
}
```

- [ ] **Step 2: Mutation API files**

`client/src/features/departments/api/create-department.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Department, type DepartmentFormValues, mapDepartmentRow } from "@/lib/domain/devices";

export async function createDepartment(v: DepartmentFormValues): Promise<Department> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("department")
    .insert({
      name: v.name,
      manager: v.manager || null,
      primary_location: v.primaryLocation || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapDepartmentRow(data);
}
```

`client/src/features/departments/api/update-department.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Department, type DepartmentFormValues, mapDepartmentRow } from "@/lib/domain/devices";

export async function updateDepartment(id: string, v: DepartmentFormValues): Promise<Department> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("department")
    .update({
      name: v.name,
      manager: v.manager || null,
      primary_location: v.primaryLocation || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDepartmentRow(data);
}
```

`client/src/features/departments/api/delete-department.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function deleteDepartment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("department").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 3: Hooks**

`client/src/features/departments/hooks/use-departments.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listDepartments } from "@/features/departments/api/list-departments";
import { queryKeys } from "@/lib/queries/keys";

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: listDepartments,
  });
}
```

`client/src/features/departments/hooks/use-departments-with-counts.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listDepartmentsWithCounts } from "@/features/departments/api/list-departments-with-counts";
import { queryKeys } from "@/lib/queries/keys";

export function useDepartmentsWithCounts() {
  return useQuery({
    queryKey: queryKeys.departments.withCounts,
    queryFn: listDepartmentsWithCounts,
  });
}
```

`client/src/features/departments/hooks/use-save-department.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentFormSchema, type DepartmentFormValues } from "@/lib/domain/devices";
import { createDepartment } from "@/features/departments/api/create-department";
import { updateDepartment } from "@/features/departments/api/update-department";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: DepartmentFormValues }) => {
      const parsed = departmentFormSchema.parse(values);
      const me = await getCurrentMember();
      const row = id ? await updateDepartment(id, parsed) : await createDepartment(parsed);
      await logActivity({
        actorId: me?.id ?? null,
        action: id ? "catalog.updated" : "catalog.created",
        entityType: "department",
        entityId: row.id,
        entityLabel: row.name,
      });
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.departments.all });
      qc.invalidateQueries({ queryKey: queryKeys.departments.withCounts });
    },
  });
}
```

`client/src/features/departments/hooks/use-delete-department.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDepartment } from "@/features/departments/api/delete-department";
import { getDepartmentById } from "@/features/departments/api/get-department";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const [row, me] = await Promise.all([getDepartmentById(id), getCurrentMember()]);
      await deleteDepartment(id);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.deleted",
        entityType: "department",
        entityId: id,
        entityLabel: row?.name ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.departments.all });
      qc.invalidateQueries({ queryKey: queryKeys.departments.withCounts });
    },
  });
}
```

- [ ] **Step 4: Page skeleton**

`client/src/app/(app)/departments/_components/page-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogPageShell } from "@/app/(app)/_components/catalog-page-shell";

export function DepartmentsPageSkeleton() {
  return (
    <CatalogPageShell
      title=""
      subtitle=""
      metaLine=""
      addLabel=""
      onAdd={() => {}}
      search=""
      onSearchChange={() => {}}
    >
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </CatalogPageShell>
  );
}
```

- [ ] **Step 5: Rewrite the page**

Replace `client/src/app/(app)/departments/page.tsx`:

```tsx
"use client";

import { useDepartmentsWithCounts } from "@/features/departments/hooks/use-departments-with-counts";
import { DepartmentsClient } from "./_components/departments-client";
import { DepartmentsPageSkeleton } from "./_components/page-skeleton";

export default function DepartmentsPage() {
  const { data: rows, isPending } = useDepartmentsWithCounts();
  if (isPending || !rows) return <DepartmentsPageSkeleton />;
  return <DepartmentsClient rows={rows} />;
}
```

- [ ] **Step 6: Switch `departments-client.tsx` off server actions**

Open `client/src/app/(app)/departments/_components/departments-client.tsx`. Replace:

```tsx
import { deleteDepartmentAction, saveDepartmentAction } from "@/app/(app)/departments/_actions";
import type { DepartmentWithCount } from "@/lib/data/departments";
```

with:

```tsx
import { useSaveDepartment } from "@/features/departments/hooks/use-save-department";
import { useDeleteDepartment } from "@/features/departments/hooks/use-delete-department";
import type { DepartmentWithCount } from "@/features/departments/api/list-departments-with-counts";
```

Inside the component, add:

```tsx
const saveDepartment = useSaveDepartment();
const deleteDepartment = useDeleteDepartment();
```

Find any `saveDepartmentAction(...)` call and replace with:

```tsx
try {
  await saveDepartment.mutateAsync({ id: editing?.id ?? null, values });
  setOpenId(null);
  toast.success(editing ? t("updated") : t("added"));
} catch (e) {
  toast.error(e instanceof Error ? e.message : tCommon("saveFailed"));
}
```

Find any `deleteDepartmentAction(...)` call and replace with:

```tsx
deleteDepartment.mutate(r.id, {
  onError: (e) => toast.error(e instanceof Error ? e.message : tCommon("deleteFailed")),
});
```

Remove `useTransition` if it becomes unused.

- [ ] **Step 7: Delete the actions file**

```bash
rm client/src/app/\(app\)/departments/_actions.ts
```

- [ ] **Step 8: Build + smoke test**

```bash
pnpm --filter client build && pnpm --filter client dev
```

Open http://localhost:3000/departments and verify:
- [ ] Skeleton on first load
- [ ] Department rows render identically
- [ ] Add / edit / delete each update the list without nav
- [ ] Reload survives

- [ ] **Step 9: Commit**

```bash
git add client/src/features/departments client/src/app/\(app\)/departments
git commit -m "feat(departments): migrate to client-side queries and mutations"
```

---

## Task 5: features/manufacturers + migrate `/manufacturers`

Mirrors Task 4 against the `manufacturer` table and `manufacturerFormSchema`. Code differs only in field names (`supportContact` vs `manager/primaryLocation`).

**Files:**
- Create: `client/src/features/manufacturers/api/{list-manufacturers,list-manufacturers-with-counts,get-manufacturer,create-manufacturer,update-manufacturer,delete-manufacturer}.ts`
- Create: `client/src/features/manufacturers/hooks/{use-manufacturers,use-manufacturers-with-counts,use-save-manufacturer,use-delete-manufacturer}.ts`
- Create: `client/src/app/(app)/manufacturers/_components/page-skeleton.tsx`
- Modify: `client/src/app/(app)/manufacturers/page.tsx`
- Modify: `client/src/app/(app)/manufacturers/_components/manufacturers-client.tsx`
- Delete: `client/src/app/(app)/manufacturers/_actions.ts`

- [ ] **Step 1: Read API files**

`client/src/features/manufacturers/api/list-manufacturers.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, mapManufacturerRow } from "@/lib/domain/devices";

export async function listManufacturers(): Promise<Manufacturer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapManufacturerRow);
}
```

`client/src/features/manufacturers/api/list-manufacturers-with-counts.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, mapManufacturerRow } from "@/lib/domain/devices";

export interface ManufacturerWithCount extends Manufacturer {
  deviceCount: number;
}

export async function listManufacturersWithCounts(): Promise<ManufacturerWithCount[]> {
  const supabase = createClient();
  const [{ data: rows, error }, { data: counts, error: countErr }] = await Promise.all([
    supabase.from("manufacturer").select("*").order("name", { ascending: true }),
    supabase.from("device").select("manufacturer_id").is("deleted_at", null),
  ]);
  if (error) throw error;
  if (countErr) throw countErr;
  const tally = new Map<string, number>();
  for (const c of counts ?? []) {
    if (c.manufacturer_id) tally.set(c.manufacturer_id, (tally.get(c.manufacturer_id) ?? 0) + 1);
  }
  return (rows ?? []).map((r) => ({
    ...mapManufacturerRow(r),
    deviceCount: tally.get(r.id) ?? 0,
  }));
}
```

`client/src/features/manufacturers/api/get-manufacturer.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, mapManufacturerRow } from "@/lib/domain/devices";

export async function getManufacturerById(id: string): Promise<Manufacturer | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapManufacturerRow(data) : null;
}
```

- [ ] **Step 2: Mutation API files**

`client/src/features/manufacturers/api/create-manufacturer.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, type ManufacturerFormValues, mapManufacturerRow } from "@/lib/domain/devices";

export async function createManufacturer(v: ManufacturerFormValues): Promise<Manufacturer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .insert({
      name: v.name,
      support_contact: v.supportContact || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapManufacturerRow(data);
}
```

`client/src/features/manufacturers/api/update-manufacturer.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Manufacturer, type ManufacturerFormValues, mapManufacturerRow } from "@/lib/domain/devices";

export async function updateManufacturer(id: string, v: ManufacturerFormValues): Promise<Manufacturer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manufacturer")
    .update({
      name: v.name,
      support_contact: v.supportContact || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapManufacturerRow(data);
}
```

`client/src/features/manufacturers/api/delete-manufacturer.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function deleteManufacturer(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("manufacturer").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 3: Hooks**

`client/src/features/manufacturers/hooks/use-manufacturers.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listManufacturers } from "@/features/manufacturers/api/list-manufacturers";
import { queryKeys } from "@/lib/queries/keys";

export function useManufacturers() {
  return useQuery({
    queryKey: queryKeys.manufacturers.all,
    queryFn: listManufacturers,
  });
}
```

`client/src/features/manufacturers/hooks/use-manufacturers-with-counts.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listManufacturersWithCounts } from "@/features/manufacturers/api/list-manufacturers-with-counts";
import { queryKeys } from "@/lib/queries/keys";

export function useManufacturersWithCounts() {
  return useQuery({
    queryKey: queryKeys.manufacturers.withCounts,
    queryFn: listManufacturersWithCounts,
  });
}
```

`client/src/features/manufacturers/hooks/use-save-manufacturer.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { manufacturerFormSchema, type ManufacturerFormValues } from "@/lib/domain/devices";
import { createManufacturer } from "@/features/manufacturers/api/create-manufacturer";
import { updateManufacturer } from "@/features/manufacturers/api/update-manufacturer";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: ManufacturerFormValues }) => {
      const parsed = manufacturerFormSchema.parse(values);
      const me = await getCurrentMember();
      const row = id ? await updateManufacturer(id, parsed) : await createManufacturer(parsed);
      await logActivity({
        actorId: me?.id ?? null,
        action: id ? "catalog.updated" : "catalog.created",
        entityType: "manufacturer",
        entityId: row.id,
        entityLabel: row.name,
      });
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.withCounts });
    },
  });
}
```

`client/src/features/manufacturers/hooks/use-delete-manufacturer.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteManufacturer } from "@/features/manufacturers/api/delete-manufacturer";
import { getManufacturerById } from "@/features/manufacturers/api/get-manufacturer";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useDeleteManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const [row, me] = await Promise.all([getManufacturerById(id), getCurrentMember()]);
      await deleteManufacturer(id);
      await logActivity({
        actorId: me?.id ?? null,
        action: "catalog.deleted",
        entityType: "manufacturer",
        entityId: id,
        entityLabel: row?.name ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
      qc.invalidateQueries({ queryKey: queryKeys.manufacturers.withCounts });
    },
  });
}
```

- [ ] **Step 4: Page skeleton**

`client/src/app/(app)/manufacturers/_components/page-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogPageShell } from "@/app/(app)/_components/catalog-page-shell";

export function ManufacturersPageSkeleton() {
  return (
    <CatalogPageShell
      title=""
      subtitle=""
      metaLine=""
      addLabel=""
      onAdd={() => {}}
      search=""
      onSearchChange={() => {}}
    >
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </CatalogPageShell>
  );
}
```

- [ ] **Step 5: Rewrite the page**

Replace `client/src/app/(app)/manufacturers/page.tsx`:

```tsx
"use client";

import { useManufacturersWithCounts } from "@/features/manufacturers/hooks/use-manufacturers-with-counts";
import { ManufacturersClient } from "./_components/manufacturers-client";
import { ManufacturersPageSkeleton } from "./_components/page-skeleton";

export default function ManufacturersPage() {
  const { data: rows, isPending } = useManufacturersWithCounts();
  if (isPending || !rows) return <ManufacturersPageSkeleton />;
  return <ManufacturersClient rows={rows} />;
}
```

- [ ] **Step 6: Switch `manufacturers-client.tsx` off server actions**

Replace:

```tsx
import { deleteManufacturerAction, saveManufacturerAction } from "@/app/(app)/manufacturers/_actions";
import type { ManufacturerWithCount } from "@/lib/data/manufacturers";
```

with:

```tsx
import { useSaveManufacturer } from "@/features/manufacturers/hooks/use-save-manufacturer";
import { useDeleteManufacturer } from "@/features/manufacturers/hooks/use-delete-manufacturer";
import type { ManufacturerWithCount } from "@/features/manufacturers/api/list-manufacturers-with-counts";
```

Add inside the component:

```tsx
const saveManufacturer = useSaveManufacturer();
const deleteManufacturer = useDeleteManufacturer();
```

Replace `saveManufacturerAction(...)` calls with the same pattern as Task 4 Step 6 (mutateAsync + try/catch toast).
Replace `deleteManufacturerAction(...)` calls with the same pattern as Task 4 Step 6 (mutate + onError toast).
Remove `useTransition` if unused.

- [ ] **Step 7: Delete the actions file**

```bash
rm client/src/app/\(app\)/manufacturers/_actions.ts
```

- [ ] **Step 8: Build + smoke test**

```bash
pnpm --filter client build && pnpm --filter client dev
```

Verify `/manufacturers`:
- [ ] Skeleton on first load
- [ ] Add / edit / delete work and update without nav

- [ ] **Step 9: Commit**

```bash
git add client/src/features/manufacturers client/src/app/\(app\)/manufacturers
git commit -m "feat(manufacturers): migrate to client-side queries and mutations"
```

---

## Task 6: features/members + migrate `/members` list and profile

**Files:**
- Create: `client/src/features/members/api/{get-members,get-member,count-devices-managed-by,invite-member,update-member-role,remove-member}.ts`
- Create: `client/src/features/members/hooks/{use-members,use-member,use-device-count-managed-by,use-invite-member,use-update-member-role,use-remove-member}.ts`
- Create: `client/src/app/(app)/members/_components/page-skeleton.tsx`
- Create: `client/src/app/(app)/members/[id]/_components/page-skeleton.tsx`
- Modify: `client/src/app/(app)/members/page.tsx`
- Modify: `client/src/app/(app)/members/[id]/page.tsx`
- Modify: `client/src/app/(app)/members/_components/invite-dialog.tsx`
- Modify: `client/src/app/(app)/members/_components/bulk-actions.tsx`
- Delete: `client/src/app/(app)/members/_actions.ts`

- [ ] **Step 1: Read API files**

`client/src/features/members/api/get-members.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { mapMemberRow, type Member, type MemberRole, type MemberRow } from "@/lib/domain/members";
import { escapePostgrestFilter } from "@/lib/queries/_filter";

type MemberJoinedRow = MemberRow & {
  department: { name: string } | null;
  reports_to_member: { name: string } | null;
};

const memberSelect = `
  *,
  department:department_id(name),
  reports_to_member:reports_to(name)
`;

export interface MemberListFilters {
  q?: string;
  role?: MemberRole | "all";
}

export async function listMembers(filters: MemberListFilters = {}): Promise<Member[]> {
  const supabase = createClient();
  let q = supabase.from("member").select(memberSelect).order("name");

  if (filters.role && filters.role !== "all") {
    q = q.eq("role", filters.role);
  }
  if (filters.q) {
    const term = filters.q.trim();
    if (term) {
      const safe = escapePostgrestFilter(term);
      q = q.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`);
    }
  }
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as MemberJoinedRow[]).map(mapMemberRow);
}
```

`client/src/features/members/api/get-member.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { mapMemberRow, type Member, type MemberRow } from "@/lib/domain/members";

type MemberJoinedRow = MemberRow & {
  department: { name: string } | null;
  reports_to_member: { name: string } | null;
};

const memberSelect = `
  *,
  department:department_id(name),
  reports_to_member:reports_to(name)
`;

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("member")
    .select(memberSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMemberRow(data as unknown as MemberJoinedRow) : null;
}
```

`client/src/features/members/api/count-devices-managed-by.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function countDevicesManagedBy(departmentId: string | null): Promise<number> {
  if (!departmentId) return 0;
  const supabase = createClient();
  const { count, error } = await supabase
    .from("device")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("department_id", departmentId);
  if (error) throw error;
  return count ?? 0;
}
```

- [ ] **Step 2: Mutation API files**

`client/src/features/members/api/invite-member.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/domain/members";

export async function inviteMember(input: InviteMemberInput, invitedBy: string): Promise<string> {
  const parsed = inviteMemberSchema.parse(input);
  const supabase = createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("member").insert({
    id,
    name: parsed.name,
    email: parsed.email,
    role: parsed.role,
    status: "invited",
    department_id: parsed.departmentId,
    invited_by: invitedBy,
  });
  if (error) throw error;
  return id;
}
```

`client/src/features/members/api/update-member-role.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { MemberRole } from "@/lib/domain/members";

export async function updateMemberRole(memberId: string, role: MemberRole): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("member").update({ role }).eq("id", memberId);
  if (error) throw error;
}
```

`client/src/features/members/api/remove-member.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function removeMember(memberId: string): Promise<string | null> {
  const supabase = createClient();
  const { data: row } = await supabase.from("member").select("email").eq("id", memberId).maybeSingle();
  const { error } = await supabase.from("member").delete().eq("id", memberId);
  if (error) throw error;
  return row?.email ?? null;
}
```

- [ ] **Step 3: Hooks**

`client/src/features/members/hooks/use-members.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listMembers, type MemberListFilters } from "@/features/members/api/get-members";
import { queryKeys } from "@/lib/queries/keys";

export function useMembers(filters: MemberListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.members.list(filters),
    queryFn: () => listMembers(filters),
  });
}
```

`client/src/features/members/hooks/use-member.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getMemberById } from "@/features/members/api/get-member";
import { queryKeys } from "@/lib/queries/keys";

export function useMember(id: string) {
  return useQuery({
    queryKey: queryKeys.members.byId(id),
    queryFn: () => getMemberById(id),
    enabled: !!id,
  });
}
```

`client/src/features/members/hooks/use-device-count-managed-by.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { countDevicesManagedBy } from "@/features/members/api/count-devices-managed-by";
import { queryKeys } from "@/lib/queries/keys";

export function useDeviceCountManagedBy(departmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.members.deviceCount(departmentId),
    queryFn: () => countDevicesManagedBy(departmentId),
  });
}
```

`client/src/features/members/hooks/use-invite-member.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteMember } from "@/features/members/api/invite-member";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can, type InviteMemberInput } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      const me = await getCurrentMember();
      if (!me || !can(me.role, "manageMembers")) throw new Error("not-allowed");
      const id = await inviteMember(input, me.id);
      await logActivity({
        actorId: me.id,
        action: "member.invited",
        entityType: "member",
        entityId: id,
        entityLabel: input.email,
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}
```

`client/src/features/members/hooks/use-update-member-role.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMemberRole } from "@/features/members/api/update-member-role";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can, type MemberRole } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: MemberRole }) => {
      const me = await getCurrentMember();
      if (!me || !can(me.role, "manageMembers")) throw new Error("not-allowed");
      await updateMemberRole(memberId, role);
      await logActivity({
        actorId: me.id,
        action: "member.role_changed",
        entityType: "member",
        entityId: memberId,
        metadata: { to: role },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}
```

`client/src/features/members/hooks/use-remove-member.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeMember } from "@/features/members/api/remove-member";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const me = await getCurrentMember();
      if (!me || !can(me.role, "manageMembers")) throw new Error("not-allowed");
      const email = await removeMember(memberId);
      await logActivity({
        actorId: me.id,
        action: "member.removed",
        entityType: "member",
        entityId: memberId,
        entityLabel: email,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}
```

- [ ] **Step 4: Page skeleton (list)**

`client/src/app/(app)/members/_components/page-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";

export function MembersPageSkeleton() {
  return (
    <PageShell title="" crumb="">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-72" />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 5: Rewrite `/members` list page**

Replace `client/src/app/(app)/members/page.tsx`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMembers } from "@/features/members/hooks/use-members";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useCurrentMember } from "@/features/auth/hooks/use-current-member";
import { can, type MemberRole } from "@/lib/domain/members";
import { PageShell } from "@/components/app/page-shell";
import { RoleSummaryRow } from "./_components/role-summary-row";
import { MembersPageClient } from "./_components/members-page-client";
import { MembersPageSkeleton } from "./_components/page-skeleton";

export default function MembersPage() {
  const t = useTranslations("members");
  const search = useSearchParams();
  const q = search.get("q") ?? undefined;
  const role = search.get("role") ?? undefined;
  const roleFilter: MemberRole | undefined =
    role === "it_admin" || role === "manager" || role === "viewer" ? role : undefined;

  const me = useCurrentMember();
  const filtered = useMembers({ q, role: roleFilter ?? "all" });
  const summary = useMembers(roleFilter || q ? {} : { q, role: roleFilter ?? "all" });
  const departments = useDepartments();

  if (
    me.isPending || !me.data ||
    filtered.isPending || !filtered.data ||
    summary.isPending || !summary.data ||
    departments.isPending || !departments.data
  ) {
    return <MembersPageSkeleton />;
  }

  const member = me.data;
  const members = filtered.data;
  const allMembersForSummary = summary.data;
  const totalAdmins = allMembersForSummary.filter((m) => m.role === "it_admin").length;
  const totalManagers = allMembersForSummary.filter((m) => m.role === "manager").length;
  const totalViewers = allMembersForSummary.filter((m) => m.role === "viewer").length;
  const canManage = can(member.role, "manageMembers");
  const isFiltered = !!(q || roleFilter);

  return (
    <PageShell title={t("title")} crumb={t("subtitle")}>
      <div className="space-y-5">
        <RoleSummaryRow
          adminCount={totalAdmins}
          managerCount={totalManagers}
          viewerCount={totalViewers}
          labels={{
            admins: t("summaryAdmins"),
            managers: t("summaryManagers"),
            viewers: t("summaryViewers"),
            capAdmin: t("capAdmin"),
            capManager: t("capManager"),
            capViewer: t("capViewer"),
          }}
        />
        <MembersPageClient
          members={members}
          currentMemberId={member.id}
          canManage={canManage}
          departments={departments.data}
          isFiltered={isFiltered}
          currentQ={q}
          currentRole={role ?? undefined}
          labels={{
            search: t("search"),
            invite: t("invite"),
            export: t("export"),
            filterAll: t("filterAll"),
            filterAdmins: t("filterAdmins"),
            filterManagers: t("filterManagers"),
            filterViewers: t("filterViewers"),
            colMember: t("colMember"),
            colRole: t("colRole"),
            colDepartment: t("colDepartment"),
            colDevicesManaged: t("colDevicesManaged"),
            colLastActive: t("colLastActive"),
            colStatus: t("colStatus"),
            youPill: t("youPill"),
            statusActive: t("statusActive"),
            statusInvited: t("statusInvited"),
            statusDisabled: t("statusDisabled"),
            emptyTitle: t("emptyTitle"),
            emptyDescription: t("emptyDescription"),
            emptyAction: t("emptyAction"),
            filteredEmptyTitle: t("filteredEmptyTitle"),
            filteredEmptyDescription: t("filteredEmptyDescription"),
            metaCount: t("metaCount", { count: members.length }),
            toast: {
              invitationSent: t("toast.invitationSent"),
              actionFailed: t("toast.actionFailed"),
            },
            inviteDialog: {
              title: t("inviteDialog.title"),
              description: t("inviteDialog.description"),
              name: t("inviteDialog.name"),
              email: t("inviteDialog.email"),
              emailHelper: t("inviteDialog.emailHelper"),
              role: t("inviteDialog.role"),
              department: t("inviteDialog.department"),
              departmentNone: t("inviteDialog.departmentNone"),
              cancel: t("inviteDialog.cancel"),
              submit: t("inviteDialog.submit"),
            },
            roleLabels: {
              it_admin: t("roleItAdmin"),
              manager: t("roleManager"),
              viewer: t("roleViewer"),
            },
          }}
        />
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 6: Switch invite-dialog + bulk-actions off server actions**

Find usages:

```bash
grep -n "inviteMemberAction\|updateMemberRoleAction\|removeMemberAction" client/src/app/\(app\)/members/_components/*.tsx
```

In `invite-dialog.tsx`:
- Replace `import { inviteMemberAction } from "@/app/(app)/members/_actions"` with `import { useInviteMember } from "@/features/members/hooks/use-invite-member"`.
- Add `const inviteMember = useInviteMember();` inside the component.
- Replace `const res = await inviteMemberAction(values)` and its `if (!res.ok)` branch with:

```tsx
try {
  await inviteMember.mutateAsync(values);
  // existing success path (close dialog, toast invitationSent)
} catch (e) {
  toast.error(e instanceof Error ? e.message : labels.toast.actionFailed);
}
```

In `bulk-actions.tsx`:
- Replace the imports for `updateMemberRoleAction` and `removeMemberAction` with hook imports.
- Add inside the component:

```tsx
const updateRole = useUpdateMemberRole();
const removeMember = useRemoveMember();
```

- Replace `await updateMemberRoleAction(id, role)` with `await updateRole.mutateAsync({ memberId: id, role })`.
- Replace `await removeMemberAction(id)` with `await removeMember.mutateAsync(id)`.
- Wrap each in `try/catch` with the same toast pattern.

- [ ] **Step 7: Profile page skeleton + rewrite**

`client/src/app/(app)/members/[id]/_components/page-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";

export function MemberProfileSkeleton() {
  return (
    <PageShell title="" crumb="">
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
```

Replace `client/src/app/(app)/members/[id]/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMember } from "@/features/members/hooks/use-member";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useActivityByActor } from "@/features/activity/hooks/use-activity-by-actor";
import { useCurrentMember } from "@/features/auth/hooks/use-current-member";
import { PageShell } from "@/components/app/page-shell";
import { ROLE_LABEL } from "@/lib/domain/members";
import { ProfileHeader } from "./_components/profile-header";
import { DetailsCard } from "./_components/details-card";
import { DevicesManaged } from "./_components/devices-managed";
import { PermissionsCard } from "./_components/permissions-card";
import { ProfileStatsCard } from "./_components/profile-stats-card";
import { RecentActivityList } from "../../overview/_components/recent-activity";
import { MemberProfileSkeleton } from "./_components/page-skeleton";

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("memberProfile");
  const me = useCurrentMember();
  const memberQ = useMember(id);
  const enableDevices = !!(memberQ.data?.departmentId && memberQ.data.role !== "viewer");
  const devicesQ = useDevices(
    enableDevices && memberQ.data ? { dept: memberQ.data.departmentId! } : {},
    { enabled: enableDevices },
  );
  const activityQ = useActivityByActor(id, 10);

  if (me.isPending || memberQ.isPending || activityQ.isPending) {
    return <MemberProfileSkeleton />;
  }
  if (!memberQ.data) notFound();

  const member = memberQ.data;
  const managedDevices = (devicesQ.data ?? []).slice(0, 6);
  const activity = activityQ.data ?? [];
  const managedCount = managedDevices.length;
  const roleCrumb = [ROLE_LABEL[member.role], member.departmentName].filter(Boolean).join(" · ");

  return (
    <PageShell title={member.name} crumb={roleCrumb || undefined}>
      <div className="space-y-6">
        <ProfileHeader member={member} isYou={me.data?.id === member.id} />
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-6">
            <DetailsCard member={member} />
            <DevicesManaged
              devices={managedDevices}
              departmentId={member.departmentId}
              departmentName={member.departmentName}
              isViewer={member.role === "viewer"}
            />
            <PermissionsCard role={member.role} />
          </div>
          <div className="space-y-6">
            <ProfileStatsCard member={member} managedCount={managedCount} />
            <RecentActivityList items={activity} title={t("activityTitle")} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
```

This references `useDevices` from `@/features/devices/hooks/use-devices`, which is created in Task 8. Until then the build will fail — that's expected. **Do not commit yet.** Continue to delete the actions file, then mark this task blocked-on-Task-8.

- [ ] **Step 8: Delete the actions file**

```bash
rm client/src/app/\(app\)/members/_actions.ts
```

- [ ] **Step 9: Build will fail — that's expected**

The `useDevices` import is forward to Task 8. Skip the build step for now. Confirm the failures are limited to the missing `@/features/devices/hooks/use-devices` import:

```bash
pnpm --filter client build 2>&1 | grep -E "error|features/devices"
```

Expected: only "Cannot find module '@/features/devices/hooks/use-devices'" type errors.

- [ ] **Step 10: Commit anyway with a note**

```bash
git add client/src/features/members client/src/app/\(app\)/members
git commit -m "feat(members): migrate to client-side queries and mutations (devices hook pending Task 8)"
```

(This commit is intentionally non-building. The next building commit is in Task 8.)

---

## Task 7: features/settings + migrate `/settings`

**Files:**
- Create: `client/src/features/settings/api/{get-org-settings,get-user-preference,update-org-settings,upsert-user-preference,purge-retired-devices}.ts`
- Create: `client/src/features/settings/hooks/{use-org-settings,use-user-preference,use-save-org-settings,use-save-user-preference,use-purge-retired}.ts`
- Create: `client/src/app/(app)/settings/_components/page-skeleton.tsx`
- Modify: `client/src/app/(app)/settings/page.tsx`
- Modify: `client/src/app/(app)/settings/_components/settings-form.tsx`
- Delete: `client/src/app/(app)/settings/_actions.ts`

- [ ] **Step 1: Read API files**

`client/src/features/settings/api/get-org-settings.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type OrgSettings, mapOrgSettingsRow } from "@/lib/domain/settings";

export async function getOrgSettings(): Promise<OrgSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw error;
  return mapOrgSettingsRow(data);
}
```

`client/src/features/settings/api/get-user-preference.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type UserPreference, mapUserPreferenceRow } from "@/lib/domain/settings";

export async function getUserPreference(userId: string): Promise<UserPreference | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_preference")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapUserPreferenceRow(data) : null;
}
```

- [ ] **Step 2: Mutation API files**

`client/src/features/settings/api/update-org-settings.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { OrgSettingsInput } from "@/lib/domain/settings";

export async function updateOrgSettings(patch: OrgSettingsInput, updatedBy: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("org_settings")
    .update({
      org_name: patch.orgName,
      primary_site: patch.primarySite,
      date_format: patch.dateFormat,
      code_prefix: patch.codePrefix,
      code_autogenerate: patch.codeAutogenerate,
      default_inventory_cycle_months: patch.defaultInventoryCycleMonths,
      condition_good_pct: patch.conditionGoodPct,
      condition_fair_pct: patch.conditionFairPct,
      warranty_expiring_days: patch.warrantyExpiringDays,
      notify_warranty: patch.notifyWarranty,
      notify_inventory_overdue: patch.notifyInventoryOverdue,
      notify_weekly_summary: patch.notifyWeeklySummary,
      notify_new_device: patch.notifyNewDevice,
      export_format: patch.exportFormat,
      deleted_retention_days: patch.deletedRetentionDays,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) throw error;
}
```

`client/src/features/settings/api/upsert-user-preference.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { UserPreferenceInput } from "@/lib/domain/settings";

export async function upsertUserPreference(userId: string, patch: UserPreferenceInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_preference")
    .upsert({
      user_id: userId,
      theme: patch.theme,
      default_device_view: patch.defaultDeviceView,
      mono_codes: patch.monoCodes,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}
```

`client/src/features/settings/api/purge-retired-devices.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { getOrgSettings } from "./get-org-settings";

export async function purgeRetiredDevices(): Promise<number> {
  const supabase = createClient();
  const settings = await getOrgSettings();
  const cutoff = new Date(Date.now() - settings.deletedRetentionDays * 86400_000).toISOString();
  const { data, error } = await supabase
    .from("device")
    .delete()
    .eq("status", "retired")
    .lt("updated_at", cutoff)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
```

> **RLS verification needed:** Confirm the `delete on device where status='retired'` policy permits an `it_admin`. If RLS blocks this from the browser, the call will silently return 0 rows. The smoke test at Step 8 must include a "Purge retired devices" click and the toast count must match the expected number.

- [ ] **Step 3: Hooks**

`client/src/features/settings/hooks/use-org-settings.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getOrgSettings } from "@/features/settings/api/get-org-settings";
import { queryKeys } from "@/lib/queries/keys";

export function useOrgSettings() {
  return useQuery({
    queryKey: queryKeys.orgSettings,
    queryFn: getOrgSettings,
  });
}
```

`client/src/features/settings/hooks/use-user-preference.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getUserPreference } from "@/features/settings/api/get-user-preference";
import { queryKeys } from "@/lib/queries/keys";

export function useUserPreference(userId: string) {
  return useQuery({
    queryKey: queryKeys.userPreference(userId),
    queryFn: () => getUserPreference(userId),
    enabled: !!userId,
  });
}
```

`client/src/features/settings/hooks/use-save-org-settings.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orgSettingsSchema, type OrgSettingsInput } from "@/lib/domain/settings";
import { updateOrgSettings } from "@/features/settings/api/update-org-settings";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveOrgSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrgSettingsInput) => {
      const me = await getCurrentMember();
      if (!me || !can(me.role, "changeSettings")) throw new Error("not-allowed");
      const parsed = orgSettingsSchema.parse(input);
      await updateOrgSettings(parsed, me.id);
      await logActivity({
        actorId: me.id,
        action: "settings.updated",
        entityType: "settings",
        entityId: null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orgSettings });
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
```

`client/src/features/settings/hooks/use-save-user-preference.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userPreferenceSchema, type UserPreferenceInput } from "@/lib/domain/settings";
import { upsertUserPreference } from "@/features/settings/api/upsert-user-preference";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useSaveUserPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UserPreferenceInput) => {
      const me = await getCurrentMember();
      if (!me) throw new Error("not-allowed");
      const parsed = userPreferenceSchema.parse(input);
      await upsertUserPreference(me.id, parsed);
      return me.id;
    },
    onSuccess: (userId) => {
      qc.invalidateQueries({ queryKey: queryKeys.userPreference(userId) });
    },
  });
}
```

`client/src/features/settings/hooks/use-purge-retired.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purgeRetiredDevices } from "@/features/settings/api/purge-retired-devices";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { can } from "@/lib/domain/members";
import { queryKeys } from "@/lib/queries/keys";

export function usePurgeRetired() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const me = await getCurrentMember();
      if (!me || !can(me.role, "changeSettings")) throw new Error("not-allowed");
      const count = await purgeRetiredDevices();
      await logActivity({
        actorId: me.id,
        action: "settings.updated",
        entityType: "settings",
        entityId: null,
        metadata: { purged: count },
      });
      return count;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
```

- [ ] **Step 4: Page skeleton**

`client/src/app/(app)/settings/_components/page-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";

export function SettingsPageSkeleton() {
  return (
    <PageShell title="">
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 5: Rewrite the page**

Replace `client/src/app/(app)/settings/page.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useCurrentMember } from "@/features/auth/hooks/use-current-member";
import { useOrgSettings } from "@/features/settings/hooks/use-org-settings";
import { useUserPreference } from "@/features/settings/hooks/use-user-preference";
import { can } from "@/lib/domain/members";
import { PageShell } from "@/components/app/page-shell";
import { PermissionDenied } from "@/components/app/states/permission-denied";
import { SettingsForm } from "./_components/settings-form";
import { SettingsPageSkeleton } from "./_components/page-skeleton";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const me = useCurrentMember();
  const orgSettings = useOrgSettings();
  const userPref = useUserPreference(me.data?.id ?? "");

  if (me.isPending || !me.data) return <SettingsPageSkeleton />;

  if (!can(me.data.role, "changeSettings")) {
    return (
      <PermissionDenied
        title={t("permissionDeniedTitle")}
        description={t("permissionDeniedDescription")}
      />
    );
  }

  if (orgSettings.isPending || userPref.isPending || !orgSettings.data) {
    return <SettingsPageSkeleton />;
  }

  return (
    <PageShell title={t("title")}>
      <SettingsForm
        initialSettings={orgSettings.data}
        initialPrefs={userPref.data ?? null}
        memberId={me.data.id}
      />
    </PageShell>
  );
}
```

- [ ] **Step 6: Switch `settings-form.tsx` off server actions**

In `client/src/app/(app)/settings/_components/settings-form.tsx`:

Replace imports of `saveOrgSettingsAction`, `saveUserPreferenceAction`, `purgeRetiredAction` with:

```tsx
import { useSaveOrgSettings } from "@/features/settings/hooks/use-save-org-settings";
import { useSaveUserPreference } from "@/features/settings/hooks/use-save-user-preference";
import { usePurgeRetired } from "@/features/settings/hooks/use-purge-retired";
```

Add inside the component:

```tsx
const saveOrgSettings = useSaveOrgSettings();
const saveUserPreference = useSaveUserPreference();
const purgeRetired = usePurgeRetired();
```

Replace each `await ___Action(...)` call site:

```tsx
// org settings
try {
  await saveOrgSettings.mutateAsync(values);
  toast.success(...); // existing success
} catch (e) {
  toast.error(e instanceof Error ? e.message : ...);
}

// user preference
try {
  await saveUserPreference.mutateAsync(values);
} catch (e) { toast.error(...); }

// purge retired
try {
  const count = await purgeRetired.mutateAsync();
  // existing success path consumes count
} catch (e) { toast.error(...); }
```

- [ ] **Step 7: Delete the actions file**

```bash
rm client/src/app/\(app\)/settings/_actions.ts
```

- [ ] **Step 8: Build + smoke test**

```bash
pnpm --filter client build
```

The build will still fail due to Task 6's pending `useDevices` import. Verify the failures are limited to that:

```bash
pnpm --filter client build 2>&1 | grep -E "error|use-devices"
```

If only members/[id]/page.tsx complains, proceed.

- [ ] **Step 9: Commit**

```bash
git add client/src/features/settings client/src/app/\(app\)/settings
git commit -m "feat(settings): migrate to client-side queries and mutations"
```

---

## Task 8: features/devices read API + migrate `/overview`

**Files:**
- Create: `client/src/features/devices/api/{get-devices,get-device,list-device-photos,list-device-documents}.ts`
- Create: `client/src/features/devices/hooks/{use-devices,use-device,use-device-photos,use-device-documents}.ts`
- Create: `client/src/app/(app)/overview/_components/page-skeleton.tsx`
- Modify: `client/src/app/(app)/overview/page.tsx`

> This task unblocks the build after Tasks 6 and 7. After Step 5 the build must succeed.

- [ ] **Step 1: Read API files**

`client/src/features/devices/api/get-devices.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { getOrgSettings } from "@/features/settings/api/get-org-settings";
import { escapePostgrestFilter } from "@/lib/queries/_filter";
import { type DeviceFlag, type DeviceWithFlags, mapDeviceWithFlagsRow } from "@/lib/domain/devices";

export interface DeviceListFilters {
  q?: string;
  group?: string;
  dept?: string;
  status?: string;
  mfr?: string;
  flag?: DeviceFlag | string;
}

export async function listDevices(filters: DeviceListFilters = {}): Promise<DeviceWithFlags[]> {
  const supabase = createClient();
  const settings = await getOrgSettings();
  let q = supabase
    .rpc("devices_with_flags", { p_warranty_days: settings.warrantyExpiringDays })
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (filters.group) q = q.eq("group_id", filters.group);
  if (filters.dept) q = q.eq("department_id", filters.dept);
  if (filters.status) q = q.eq("status", filters.status as "in-use" | "in-storage" | "in-repair" | "retired");
  if (filters.mfr) q = q.eq("manufacturer_id", filters.mfr);
  if (filters.flag === "warranty-expiring") q = q.eq("flag_warranty_expiring", true);
  if (filters.flag === "inventory-overdue") q = q.eq("flag_inventory_overdue", true);
  if (filters.q) {
    const term = filters.q.trim();
    if (term) {
      const safe = escapePostgrestFilter(term);
      q = q.or(
        `name.ilike.%${safe}%,code.ilike.%${safe}%,serial_number.ilike.%${safe}%,model.ilike.%${safe}%`
      );
    }
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapDeviceWithFlagsRow);
}
```

`client/src/features/devices/api/get-device.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { getOrgSettings } from "@/features/settings/api/get-org-settings";
import { type Device, type DeviceWithFlags, mapDeviceRow, mapDeviceWithFlagsRow } from "@/lib/domain/devices";

export async function getDeviceWithFlagsByCode(code: string): Promise<DeviceWithFlags | null> {
  const supabase = createClient();
  const settings = await getOrgSettings();
  const { data, error } = await supabase
    .rpc("devices_with_flags", { p_warranty_days: settings.warrantyExpiringDays })
    .select("*")
    .eq("code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDeviceWithFlagsRow(data) : null;
}

export async function getDeviceById(id: string): Promise<Device | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDeviceRow(data) : null;
}
```

`client/src/features/devices/api/list-device-photos.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type DevicePhoto, mapPhotoRow } from "@/lib/domain/devices";

export async function listDevicePhotos(deviceId: string): Promise<DevicePhoto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_photo")
    .select("*")
    .eq("device_id", deviceId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPhotoRow);
}
```

`client/src/features/devices/api/list-device-documents.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type DeviceDocument, mapDocumentRow } from "@/lib/domain/devices";

export async function listDeviceDocuments(deviceId: string): Promise<DeviceDocument[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_document")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDocumentRow);
}
```

- [ ] **Step 2: Hooks**

`client/src/features/devices/hooks/use-devices.ts`:

```ts
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listDevices, type DeviceListFilters } from "@/features/devices/api/get-devices";
import type { DeviceWithFlags } from "@/lib/domain/devices";
import { queryKeys } from "@/lib/queries/keys";

type Opts = Omit<UseQueryOptions<DeviceWithFlags[], Error>, "queryKey" | "queryFn">;

export function useDevices(filters: DeviceListFilters = {}, opts: Opts = {}) {
  return useQuery({
    queryKey: queryKeys.devices.list(filters),
    queryFn: () => listDevices(filters),
    ...opts,
  });
}
```

`client/src/features/devices/hooks/use-device.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getDeviceWithFlagsByCode } from "@/features/devices/api/get-device";
import { queryKeys } from "@/lib/queries/keys";

export function useDeviceByCode(code: string) {
  return useQuery({
    queryKey: queryKeys.devices.byCode(code),
    queryFn: () => getDeviceWithFlagsByCode(code),
    enabled: !!code,
  });
}
```

`client/src/features/devices/hooks/use-device-photos.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listDevicePhotos } from "@/features/devices/api/list-device-photos";
import { queryKeys } from "@/lib/queries/keys";

export function useDevicePhotos(deviceId: string) {
  return useQuery({
    queryKey: queryKeys.devices.photos(deviceId),
    queryFn: () => listDevicePhotos(deviceId),
    enabled: !!deviceId,
  });
}
```

`client/src/features/devices/hooks/use-device-documents.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { listDeviceDocuments } from "@/features/devices/api/list-device-documents";
import { queryKeys } from "@/lib/queries/keys";

export function useDeviceDocuments(deviceId: string) {
  return useQuery({
    queryKey: queryKeys.devices.documents(deviceId),
    queryFn: () => listDeviceDocuments(deviceId),
    enabled: !!deviceId,
  });
}
```

- [ ] **Step 3: Overview skeleton**

`client/src/app/(app)/overview/_components/page-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";

export function OverviewPageSkeleton() {
  return (
    <PageShell title="" crumb="">
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-5">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 4: Rewrite the page**

Replace `client/src/app/(app)/overview/page.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { HardDrive, CircleCheckBig, TriangleAlert, Wrench, List, Plus } from "lucide-react";
import Link from "next/link";
import { useDevices } from "@/features/devices/hooks/use-devices";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { useRecentActivity } from "@/features/activity/hooks/use-recent-activity";
import { PageShell } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { KpiCard } from "./_components/kpi-card";
import { LifecycleBar, type LifecycleSegment } from "./_components/lifecycle-bar";
import { GroupShareBars, type GroupShareRow } from "./_components/group-share-bars";
import { AttentionRail } from "./_components/attention-rail";
import { RecentActivityList } from "./_components/recent-activity";
import { OverviewPageSkeleton } from "./_components/page-skeleton";

export default function OverviewPage() {
  const t = useTranslations("overview");
  const devicesQ = useDevices();
  const groupsQ = useGroups();
  const activityQ = useRecentActivity(5);

  if (devicesQ.isPending || groupsQ.isPending || activityQ.isPending) {
    return <OverviewPageSkeleton />;
  }

  const devices = devicesQ.data ?? [];
  const groups = groupsQ.data ?? [];
  const activity = activityQ.data ?? [];

  const total = devices.length;
  const inUse = devices.filter((d) => d.status === "in-use").length;
  const inStorage = devices.filter((d) => d.status === "in-storage").length;
  const inRepair = devices.filter((d) => d.status === "in-repair").length;
  const retired = devices.filter((d) => d.status === "retired").length;
  const needsAttention = devices.filter((d) => d.flags.length > 0).length;
  const totalQuantity = devices.reduce((s, d) => s + d.quantity, 0);
  const distinctDepts = new Set(devices.map((d) => d.departmentId)).size;
  const avgCondition = total ? Math.round(devices.reduce((s, d) => s + d.condition, 0) / total) : 0;

  const segments: LifecycleSegment[] = [
    { key: "in-use",     label: t("statusInUse"),     count: inUse,     colorVar: "--green-500" },
    { key: "in-storage", label: t("statusInStorage"), count: inStorage, colorVar: "--status-storage" },
    { key: "in-repair",  label: t("statusInRepair"),  count: inRepair,  colorVar: "--status-repair" },
    { key: "retired",    label: t("statusRetired"),   count: retired,   colorVar: "--muted-foreground" },
  ];

  const groupCountMap = new Map<string, number>();
  for (const d of devices) {
    groupCountMap.set(d.groupId, (groupCountMap.get(d.groupId) ?? 0) + 1);
  }
  const groupShareRows: GroupShareRow[] = Array.from(groupCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([groupId, count]) => {
      const group = groups.find((g) => g.id === groupId);
      return {
        groupId,
        groupName: group?.name ?? groupId,
        groupIcon: group?.icon ?? null,
        count,
      };
    });

  const attentionDevices = devices.filter((d) => d.flags.length > 0);
  const attentionSubtitle = attentionDevices.length > 0
    ? t("attentionSubtitle", { count: attentionDevices.length, repair: inRepair })
    : t("attentionOnTrack");

  return (
    <PageShell
      title={t("title")}
      crumb={t("subtitle")}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href="/devices"><List className="size-4 mr-1.5" />{t("viewInventory")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/devices/new"><Plus className="size-4 mr-1.5" />{t("addDevice")}</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={HardDrive}
            label={t("kpiTotalDevices")}
            value={total}
            subtitle={t("kpiTotalSubtitle", { quantity: totalQuantity, departments: distinctDepts })}
          />
          <KpiCard
            icon={CircleCheckBig}
            label={t("kpiInUse")}
            value={inUse}
            subtitle={t("kpiInUseSubtitle", { storage: inStorage, retired })}
          />
          <KpiCard
            icon={TriangleAlert}
            label={t("kpiNeedsAttention")}
            value={needsAttention}
            tone={needsAttention > 0 ? "alert" : "default"}
            subtitle={t("kpiAttentionSubtitle")}
          />
          <KpiCard
            icon={Wrench}
            label={t("kpiInRepair")}
            value={inRepair}
            subtitle={t("kpiInRepairSubtitle", { avg: avgCondition })}
          />
        </div>
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-5">
            <LifecycleBar
              segments={segments}
              total={total}
              title={t("lifecycleTitle")}
              subtitle={t("lifecycleSubtitle")}
            />
            <GroupShareBars
              rows={groupShareRows}
              total={total}
              title={t("groupShareTitle")}
              subtitle={t("groupShareSubtitle", { total })}
              manageLabel={t("groupShareManage")}
              manageHref="/groups"
            />
          </div>
          <div className="space-y-5">
            <AttentionRail
              devices={attentionDevices}
              title={t("attentionTitle")}
              subtitle={attentionSubtitle}
              emptyText={t("attentionEmpty")}
            />
            <RecentActivityList
              items={activity}
              title={t("activityTitle")}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 5: Build — should succeed now**

```bash
pnpm --filter client build
```

Expected: success. Tasks 6 and 7's pending imports now resolve.

- [ ] **Step 6: Smoke test**

```bash
pnpm --filter client dev
```

Verify each page touched so far:
- [ ] `/overview` — skeleton then identical layout, all KPIs, lifecycle bar, group shares, attention rail, recent activity
- [ ] `/groups`, `/departments`, `/manufacturers` — still working
- [ ] `/settings` — loads, save works, purge works
- [ ] `/members` — list, summary cards, filters via URL still work
- [ ] `/members/<id>` — profile loads, managed devices appear, activity feed appears

- [ ] **Step 7: Commit**

```bash
git add client/src/features/devices client/src/app/\(app\)/overview
git commit -m "feat(overview): migrate to client-side queries"
```

---

## Task 9: features/devices mutations + migrate `/devices` list

**Files:**
- Create: `client/src/features/devices/api/{create-device,update-device,soft-delete-device,bulk-update-status,bulk-soft-delete}.ts`
- Create: `client/src/features/devices/hooks/{use-create-device,use-update-device,use-delete-device,use-bulk-update-status,use-bulk-delete}.ts`
- Create: `client/src/app/(app)/devices/_components/page-skeleton.tsx`
- Modify: `client/src/app/(app)/devices/page.tsx`
- Modify: `client/src/app/(app)/devices/_components/device-list-client.tsx`
- Modify: `client/src/app/(app)/devices/_components/device-bulk-actions.tsx`

- [ ] **Step 1: Mutation API files**

`client/src/features/devices/api/create-device.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Device, type DeviceFormValues, deviceFormToInsert, mapDeviceRow } from "@/lib/domain/devices";

export async function createDevice(values: DeviceFormValues): Promise<Device> {
  const supabase = createClient();
  const insert = deviceFormToInsert(values);
  const { data, error } = await supabase
    .from("device")
    .insert(insert)
    .select("*")
    .single();
  if (error) throw error;
  return mapDeviceRow(data);
}
```

`client/src/features/devices/api/update-device.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type Device, type DeviceFormValues, deviceFormToInsert, mapDeviceRow } from "@/lib/domain/devices";
import type { Database } from "@/types/database.types";

export async function updateDevice(id: string, values: DeviceFormValues): Promise<Device> {
  const supabase = createClient();
  const update: Database["public"]["Tables"]["device"]["Update"] = deviceFormToInsert(values);
  const { data, error } = await supabase
    .from("device")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDeviceRow(data);
}
```

`client/src/features/devices/api/soft-delete-device.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function softDeleteDevice(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("device")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
```

`client/src/features/devices/api/bulk-update-status.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { DeviceStatus } from "@/lib/domain/devices";

export async function bulkUpdateDeviceStatus(ids: string[], status: DeviceStatus): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("device")
    .update({ status })
    .in("id", ids);
  if (error) throw error;
}
```

`client/src/features/devices/api/bulk-soft-delete.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function bulkSoftDeleteDevices(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("device")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}
```

- [ ] **Step 2: Mutation hooks**

`client/src/features/devices/hooks/use-create-device.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceFormSchema, type DeviceFormValues } from "@/lib/domain/devices";
import { createDevice } from "@/features/devices/api/create-device";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: DeviceFormValues) => {
      const parsed = deviceFormSchema.parse(values);
      const device = await createDevice(parsed);
      const me = await getCurrentMember();
      await logActivity({
        actorId: me?.id ?? null,
        action: "device.created",
        entityType: "device",
        entityId: device.id,
        entityLabel: device.name,
      });
      return device;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
```

`client/src/features/devices/hooks/use-update-device.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceFormSchema, type DeviceFormValues } from "@/lib/domain/devices";
import { updateDevice } from "@/features/devices/api/update-device";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: DeviceFormValues }) => {
      const parsed = deviceFormSchema.parse(values);
      const device = await updateDevice(id, parsed);
      const me = await getCurrentMember();
      await logActivity({
        actorId: me?.id ?? null,
        action: "device.updated",
        entityType: "device",
        entityId: device.id,
        entityLabel: device.name,
      });
      return device;
    },
    onSuccess: (device) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
      qc.invalidateQueries({ queryKey: queryKeys.devices.byCode(device.code) });
    },
  });
}
```

`client/src/features/devices/hooks/use-delete-device.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { softDeleteDevice } from "@/features/devices/api/soft-delete-device";
import { getDeviceById } from "@/features/devices/api/get-device";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const [device, me] = await Promise.all([getDeviceById(id), getCurrentMember()]);
      await softDeleteDevice(id);
      await logActivity({
        actorId: me?.id ?? null,
        action: "device.deleted",
        entityType: "device",
        entityId: id,
        entityLabel: device?.name ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
```

`client/src/features/devices/hooks/use-bulk-update-status.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkUpdateDeviceStatus } from "@/features/devices/api/bulk-update-status";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import type { DeviceStatus } from "@/lib/domain/devices";
import { queryKeys } from "@/lib/queries/keys";

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: DeviceStatus }) => {
      await bulkUpdateDeviceStatus(ids, status);
      const me = await getCurrentMember();
      await Promise.all(ids.map((id) =>
        logActivity({ actorId: me?.id ?? null, action: "device.updated", entityType: "device", entityId: id, entityLabel: null })
      ));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
```

`client/src/features/devices/hooks/use-bulk-delete.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkSoftDeleteDevices } from "@/features/devices/api/bulk-soft-delete";
import { logActivity } from "@/features/activity/api/log-activity";
import { getCurrentMember } from "@/features/auth/api/get-current-member";
import { queryKeys } from "@/lib/queries/keys";

export function useBulkDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await bulkSoftDeleteDevices(ids);
      const me = await getCurrentMember();
      await Promise.all(ids.map((id) =>
        logActivity({ actorId: me?.id ?? null, action: "device.deleted", entityType: "device", entityId: id, entityLabel: null })
      ));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
```

- [ ] **Step 3: Page skeleton**

`client/src/app/(app)/devices/_components/page-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/app/page-shell";

export function DevicesPageSkeleton() {
  return (
    <PageShell title="" crumb="">
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-10 w-72" />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 4: Rewrite the page**

Replace `client/src/app/(app)/devices/page.tsx`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { useDevices } from "@/features/devices/hooks/use-devices";
import type { DeviceListFilters } from "@/features/devices/api/get-devices";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useManufacturers } from "@/features/manufacturers/hooks/use-manufacturers";
import { PageShell } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { DeviceListClient } from "./_components/device-list-client";
import { DevicesPageSkeleton } from "./_components/page-skeleton";

export default function DevicesPage() {
  const t = useTranslations("devices.list");
  const params = useSearchParams();
  const filters: DeviceListFilters = {
    q: params.get("q") ?? undefined,
    group: params.get("group") ?? undefined,
    dept: params.get("dept") ?? undefined,
    status: params.get("status") ?? undefined,
    mfr: params.get("mfr") ?? undefined,
    flag: params.get("flag") ?? undefined,
  };
  const view = params.get("view") === "cards" ? "cards" : "table";

  const devicesQ = useDevices(filters);
  const groupsQ = useGroups();
  const deptsQ = useDepartments();
  const mfrsQ = useManufacturers();

  if (devicesQ.isPending || groupsQ.isPending || deptsQ.isPending || mfrsQ.isPending) {
    return <DevicesPageSkeleton />;
  }

  return (
    <PageShell
      title={t("title")}
      crumb={t("subtitle")}
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="size-4" /> {t("export")}
          </Button>
          <Button size="sm" asChild>
            <Link href="/devices/new">
              <Plus className="size-4" /> {t("addDevice")}
            </Link>
          </Button>
        </>
      }
    >
      <DeviceListClient
        devices={devicesQ.data ?? []}
        groups={groupsQ.data ?? []}
        departments={deptsQ.data ?? []}
        manufacturers={mfrsQ.data ?? []}
        initialFilters={filters}
        initialView={view}
      />
    </PageShell>
  );
}
```

- [ ] **Step 5: Switch `device-bulk-actions.tsx` off server actions**

Open `client/src/app/(app)/devices/_components/device-bulk-actions.tsx` and:

- Replace `import { bulkDeleteAction, bulkUpdateStatusAction } from "@/app/(app)/devices/_actions"` with:

```tsx
import { useBulkUpdateStatus } from "@/features/devices/hooks/use-bulk-update-status";
import { useBulkDelete } from "@/features/devices/hooks/use-bulk-delete";
```

- Inside the component, add:

```tsx
const bulkUpdateStatus = useBulkUpdateStatus();
const bulkDelete = useBulkDelete();
```

- Replace `await bulkUpdateStatusAction(ids, status)` with:

```tsx
try {
  await bulkUpdateStatus.mutateAsync({ ids, status });
} catch (e) {
  toast.error(e instanceof Error ? e.message : tCommon("saveFailed"));
}
```

- Replace `await bulkDeleteAction(ids)` with:

```tsx
try {
  await bulkDelete.mutateAsync(ids);
} catch (e) {
  toast.error(e instanceof Error ? e.message : tCommon("deleteFailed"));
}
```

- [ ] **Step 6: device-list-client.tsx — any inner action calls**

Check for residual action callers:

```bash
grep -n "Action" client/src/app/\(app\)/devices/_components/device-list-client.tsx
```

If any (e.g. inline delete in a row menu), apply the same hook-replacement pattern as above.

- [ ] **Step 7: Build + smoke test**

```bash
pnpm --filter client build && pnpm --filter client dev
```

Verify `/devices`:
- [ ] Skeleton on first load
- [ ] Filters via URL (`/devices?status=in-use`, `/devices?group=<id>`) populate correctly
- [ ] Search input updates the list
- [ ] Bulk update status works → toast → list refreshes
- [ ] Bulk delete works → row(s) gone

- [ ] **Step 8: Commit**

```bash
git add client/src/features/devices client/src/app/\(app\)/devices/page.tsx client/src/app/\(app\)/devices/_components/page-skeleton.tsx client/src/app/\(app\)/devices/_components/device-list-client.tsx client/src/app/\(app\)/devices/_components/device-bulk-actions.tsx
git commit -m "feat(devices): migrate list page to client-side queries and mutations"
```

---

## Task 10: features/devices — storage, photos/docs, detail + form pages

**Files:**
- Create: `client/src/features/devices/api/{insert-photo-rows,update-photo-order,delete-photo-row,insert-document-rows,delete-document-row,set-cover-photo,signed-photo-urls,signed-document-urls,remove-photo-object,remove-document-object}.ts`
- Create: `client/src/features/devices/hooks/{use-signed-photo-urls,use-signed-document-urls,use-insert-photos,use-reorder-photos,use-remove-photo,use-set-cover-photo,use-insert-documents,use-remove-document}.ts`
- Create: `client/src/app/(app)/devices/[code]/_components/page-skeleton.tsx`
- Create: `client/src/app/(app)/devices/new/_components/page-skeleton.tsx`
- Modify: `client/src/app/(app)/devices/[code]/page.tsx`
- Modify: `client/src/app/(app)/devices/[code]/edit/page.tsx`
- Modify: `client/src/app/(app)/devices/new/page.tsx`
- Modify: `client/src/app/(app)/devices/_components/device-form.tsx`
- Delete: `client/src/app/(app)/devices/_actions.ts`

- [ ] **Step 1: Storage API files**

`client/src/features/devices/api/signed-photo-urls.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export const PHOTO_BUCKET = "device-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function signedPhotoUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) return {};
  const out: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}
```

`client/src/features/devices/api/signed-document-urls.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export const DOCUMENT_BUCKET = "device-documents";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function signedDocumentUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function signedDocumentUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) return {};
  const out: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}
```

`client/src/features/devices/api/remove-photo-object.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "./signed-photo-urls";

export async function removePhotoObject(path: string): Promise<void> {
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}
```

`client/src/features/devices/api/remove-document-object.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_BUCKET } from "./signed-document-urls";

export async function removeDocumentObject(path: string): Promise<void> {
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
}
```

- [ ] **Step 2: Photo + document row API files**

`client/src/features/devices/api/insert-photo-rows.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type DevicePhoto, mapPhotoRow } from "@/lib/domain/devices";

export async function insertPhotoRows(
  deviceId: string,
  photos: { url: string; fileName: string | null; sizeBytes: number | null; sortOrder: number }[]
): Promise<DevicePhoto[]> {
  if (photos.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_photo")
    .insert(
      photos.map((p) => ({
        device_id: deviceId,
        url: p.url,
        file_name: p.fileName,
        size_bytes: p.sizeBytes,
        sort_order: p.sortOrder,
      }))
    )
    .select("*");
  if (error) throw error;
  return (data ?? []).map(mapPhotoRow);
}
```

`client/src/features/devices/api/update-photo-order.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function updatePhotoOrder(
  rows: { id: string; sortOrder: number }[]
): Promise<void> {
  if (rows.length === 0) return;
  const supabase = createClient();
  for (const r of rows) {
    const { error } = await supabase
      .from("device_photo")
      .update({ sort_order: r.sortOrder })
      .eq("id", r.id);
    if (error) throw error;
  }
}
```

`client/src/features/devices/api/delete-photo-row.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function deletePhotoRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("device_photo").delete().eq("id", id);
  if (error) throw error;
}
```

`client/src/features/devices/api/set-cover-photo.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function setCoverPhoto(deviceId: string, photoId: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("device")
    .update({ cover_photo_id: photoId })
    .eq("id", deviceId);
  if (error) throw error;
}
```

`client/src/features/devices/api/insert-document-rows.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import { type DeviceDocument, mapDocumentRow } from "@/lib/domain/devices";

export async function insertDocumentRows(
  deviceId: string,
  docs: { url: string; fileName: string; mimeType: string | null; sizeBytes: number | null }[]
): Promise<DeviceDocument[]> {
  if (docs.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_document")
    .insert(
      docs.map((d) => ({
        device_id: deviceId,
        url: d.url,
        file_name: d.fileName,
        mime_type: d.mimeType,
        size_bytes: d.sizeBytes,
      }))
    )
    .select("*");
  if (error) throw error;
  return (data ?? []).map(mapDocumentRow);
}
```

`client/src/features/devices/api/delete-document-row.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function deleteDocumentRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("device_document").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 3: Storage hooks**

`client/src/features/devices/hooks/use-signed-photo-urls.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { signedPhotoUrls } from "@/features/devices/api/signed-photo-urls";
import { queryKeys } from "@/lib/queries/keys";

export function useSignedPhotoUrls(paths: string[]) {
  return useQuery({
    queryKey: queryKeys.storage.photoUrls(paths),
    queryFn: () => signedPhotoUrls(paths),
    enabled: paths.length > 0,
    staleTime: 50 * 60_000, // signed URLs live 60 min; refresh comfortably before expiry
  });
}
```

`client/src/features/devices/hooks/use-signed-document-urls.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { signedDocumentUrls } from "@/features/devices/api/signed-document-urls";
import { queryKeys } from "@/lib/queries/keys";

export function useSignedDocumentUrls(paths: string[]) {
  return useQuery({
    queryKey: queryKeys.storage.documentUrls(paths),
    queryFn: () => signedDocumentUrls(paths),
    enabled: paths.length > 0,
    staleTime: 50 * 60_000,
  });
}
```

- [ ] **Step 4: Photo/document mutation hooks**

`client/src/features/devices/hooks/use-insert-photos.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertPhotoRows } from "@/features/devices/api/insert-photo-rows";
import { queryKeys } from "@/lib/queries/keys";

export function useInsertPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, photos }: {
      deviceId: string;
      photos: { url: string; fileName: string | null; sizeBytes: number | null; sortOrder: number }[];
    }) => insertPhotoRows(deviceId, photos),
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.photos(deviceId) });
    },
  });
}
```

`client/src/features/devices/hooks/use-reorder-photos.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePhotoOrder } from "@/features/devices/api/update-photo-order";
import { queryKeys } from "@/lib/queries/keys";

export function useReorderPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rows }: { deviceId: string; rows: { id: string; sortOrder: number }[] }) =>
      updatePhotoOrder(rows),
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.photos(deviceId) });
    },
  });
}
```

`client/src/features/devices/hooks/use-remove-photo.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePhotoRow } from "@/features/devices/api/delete-photo-row";
import { removePhotoObject } from "@/features/devices/api/remove-photo-object";
import { queryKeys } from "@/lib/queries/keys";

export function useRemovePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId, storagePath }: { deviceId: string; photoId: string; storagePath: string }) => {
      await removePhotoObject(storagePath);
      await deletePhotoRow(photoId);
    },
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.photos(deviceId) });
    },
  });
}
```

`client/src/features/devices/hooks/use-set-cover-photo.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setCoverPhoto } from "@/features/devices/api/set-cover-photo";
import { queryKeys } from "@/lib/queries/keys";

export function useSetCoverPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, photoId }: { deviceId: string; photoId: string | null }) =>
      setCoverPhoto(deviceId, photoId),
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.all });
      qc.invalidateQueries({ queryKey: queryKeys.devices.byId(deviceId) });
    },
  });
}
```

`client/src/features/devices/hooks/use-insert-documents.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertDocumentRows } from "@/features/devices/api/insert-document-rows";
import { queryKeys } from "@/lib/queries/keys";

export function useInsertDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, docs }: {
      deviceId: string;
      docs: { url: string; fileName: string; mimeType: string | null; sizeBytes: number | null }[];
    }) => insertDocumentRows(deviceId, docs),
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.documents(deviceId) });
    },
  });
}
```

`client/src/features/devices/hooks/use-remove-document.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocumentRow } from "@/features/devices/api/delete-document-row";
import { removeDocumentObject } from "@/features/devices/api/remove-document-object";
import { queryKeys } from "@/lib/queries/keys";

export function useRemoveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docId, storagePath }: { deviceId: string; docId: string; storagePath: string }) => {
      await removeDocumentObject(storagePath);
      await deleteDocumentRow(docId);
    },
    onSuccess: (_data, { deviceId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.devices.documents(deviceId) });
    },
  });
}
```

- [ ] **Step 5: Detail page skeleton**

`client/src/app/(app)/devices/[code]/_components/page-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PageTopbar } from "@/components/app/page-topbar";

export function DeviceDetailSkeleton() {
  return (
    <>
      <PageTopbar title="" />
      <div className="px-7 py-7 space-y-5">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-1 [@media(min-width:1080px)]:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
          <div className="space-y-5">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Rewrite `/devices/[code]` detail page**

Replace `client/src/app/(app)/devices/[code]/page.tsx` (only the page export — keep the helper components at the bottom of the existing file). Easiest: copy the bottom helpers (`SectionTitle`, `SectionCard`, `DefList`, `RailStat`, `TimelineItem`, `formatDate`) into a new file `client/src/app/(app)/devices/[code]/_components/detail-helpers.tsx`, then import them. To stay surgical, this plan keeps them inline:

```tsx
"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft, CalendarClock, ClipboardCheck, Cpu, Fingerprint, Gauge,
  History, MapPin, MoreHorizontal, Pencil, Printer, ShieldCheck, StickyNote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeviceByCode } from "@/features/devices/hooks/use-device";
import { useDevicePhotos } from "@/features/devices/hooks/use-device-photos";
import { useDeviceDocuments } from "@/features/devices/hooks/use-device-documents";
import { useGroupById } from "@/features/groups/hooks/use-group";
import { useDepartmentById } from "@/features/departments/hooks/use-department";
import { useManufacturerById } from "@/features/manufacturers/hooks/use-manufacturer";
import { useSignedPhotoUrls } from "@/features/devices/hooks/use-signed-photo-urls";
import { useSignedDocumentUrls } from "@/features/devices/hooks/use-signed-document-urls";
import { GroupIcon } from "@/components/app/group-icon";
import { StatusBadge } from "@/components/app/status-badge";
import { FlagChip } from "@/components/app/flag-chip";
import { ConditionRing } from "@/components/app/condition-ring";
import { PageTopbar } from "@/components/app/page-topbar";
import { formatBytes } from "@/lib/domain/devices";
import { DeviceDetailSkeleton } from "./_components/page-skeleton";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function DeviceDetailsPage({ params }: PageProps) {
  const { code } = use(params);
  const decodedCode = decodeURIComponent(code);
  const t = useTranslations("devices.details");
  const tSource = useTranslations("devices.source");
  const tUnit = useTranslations("devices.unit");

  const deviceQ = useDeviceByCode(decodedCode);
  const photosQ = useDevicePhotos(deviceQ.data?.id ?? "");
  const docsQ = useDeviceDocuments(deviceQ.data?.id ?? "");
  const groupQ = useGroupById(deviceQ.data?.groupId ?? "");
  const deptQ = useDepartmentById(deviceQ.data?.departmentId ?? "");
  const mfrQ = useManufacturerById(deviceQ.data?.manufacturerId ?? "");

  const photoPaths = (photosQ.data ?? []).map((p) => p.url);
  const docPaths = (docsQ.data ?? []).map((d) => d.url);
  const photoUrlsQ = useSignedPhotoUrls(photoPaths);
  const docUrlsQ = useSignedDocumentUrls(docPaths);

  if (
    deviceQ.isPending ||
    photosQ.isPending ||
    docsQ.isPending ||
    groupQ.isPending ||
    deptQ.isPending ||
    mfrQ.isPending
  ) {
    return <DeviceDetailSkeleton />;
  }
  if (!deviceQ.data) notFound();

  const device = deviceQ.data;
  const photos = photosQ.data ?? [];
  const documents = docsQ.data ?? [];
  const group = groupQ.data;
  const dept = deptQ.data;
  const mfr = mfrQ.data;
  const photoUrlMap = photoUrlsQ.data ?? {};
  const docUrlMap = docUrlsQ.data ?? {};

  const now = new Date();
  const warrantyDaysLeft = device.warrantyEnd
    ? Math.ceil((new Date(device.warrantyEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const nextInventoryDue = device.lastCheckDate
    ? new Date(new Date(device.lastCheckDate).setMonth(
        new Date(device.lastCheckDate).getMonth() + device.inventoryCycleMonths))
    : null;

  // ↓↓↓ paste the entire JSX from the previous version of this file
  //     (the `<> <PageTopbar ... /> <div className="px-7 py-7"> ... </div> </>` block)
  //     unchanged. The local helper components SectionTitle / SectionCard / DefList /
  //     RailStat / TimelineItem / formatDate remain at the bottom of this file.
  return (
    <>{/* JSX preserved verbatim from the prior server-component version */}</>
  );
}

// SectionTitle, SectionCard, DefList, RailStat, TimelineItem, formatDate:
// keep them exactly as they appear in the current file.
```

> **Apply note:** The body of the returned JSX is verbatim from the existing file. The agent applying this step should `git show HEAD:client/src/app/(app)/devices/[code]/page.tsx` for the current version, copy the JSX body (lines 82–331) and the local helpers (lines 333–439) into the new file, and only swap the data sources (server fetches → hook results). No styling or component-tree changes.

- [ ] **Step 7: Add three small lookup hooks**

`client/src/features/groups/hooks/use-group.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getGroupById } from "@/features/groups/api/get-group";
import { queryKeys } from "@/lib/queries/keys";

export function useGroupById(id: string) {
  return useQuery({
    queryKey: queryKeys.groups.byId(id),
    queryFn: () => getGroupById(id),
    enabled: !!id,
  });
}
```

`client/src/features/departments/hooks/use-department.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getDepartmentById } from "@/features/departments/api/get-department";
import { queryKeys } from "@/lib/queries/keys";

export function useDepartmentById(id: string) {
  return useQuery({
    queryKey: queryKeys.departments.byId(id),
    queryFn: () => getDepartmentById(id),
    enabled: !!id,
  });
}
```

`client/src/features/manufacturers/hooks/use-manufacturer.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getManufacturerById } from "@/features/manufacturers/api/get-manufacturer";
import { queryKeys } from "@/lib/queries/keys";

export function useManufacturerById(id: string) {
  return useQuery({
    queryKey: queryKeys.manufacturers.byId(id),
    queryFn: () => getManufacturerById(id),
    enabled: !!id,
  });
}
```

- [ ] **Step 8: Rewrite `/devices/new`**

Replace `client/src/app/(app)/devices/new/page.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useManufacturers } from "@/features/manufacturers/hooks/use-manufacturers";
import { DeviceForm } from "@/app/(app)/devices/_components/device-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeviceFormValues } from "@/lib/domain/devices";

const defaults: DeviceFormValues = {
  name: "", code: "", groupId: "", departmentId: "", manufacturerId: null,
  model: "", serialNumber: "", specifications: "", notes: "", condition: 100,
  location: "", quantity: 1, unit: "piece", source: null, status: "in-storage",
  importDate: null, lastCheckDate: null, inventoryCycleMonths: 12,
  warrantyStart: null, warrantyEnd: null,
};

export default function NewDevicePage() {
  const t = useTranslations("devices.new");
  const groups = useGroups();
  const depts = useDepartments();
  const mfrs = useManufacturers();

  if (groups.isPending || depts.isPending || mfrs.isPending) {
    return (
      <div className="px-7 py-7 space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <DeviceForm
      mode="create"
      initialValues={defaults}
      initialPhotos={[]}
      initialDocuments={[]}
      groups={groups.data ?? []}
      departments={depts.data ?? []}
      manufacturers={mfrs.data ?? []}
      pageTitle={t("pageTitle")}
      pageSubtitle={t("pageSubtitle")}
    />
  );
}
```

- [ ] **Step 9: Rewrite `/devices/[code]/edit`**

Replace `client/src/app/(app)/devices/[code]/edit/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDeviceByCode } from "@/features/devices/hooks/use-device";
import { useDevicePhotos } from "@/features/devices/hooks/use-device-photos";
import { useDeviceDocuments } from "@/features/devices/hooks/use-device-documents";
import { useSignedPhotoUrls } from "@/features/devices/hooks/use-signed-photo-urls";
import { useSignedDocumentUrls } from "@/features/devices/hooks/use-signed-document-urls";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useManufacturers } from "@/features/manufacturers/hooks/use-manufacturers";
import { DeviceForm } from "@/app/(app)/devices/_components/device-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeviceFormValues } from "@/lib/domain/devices";
import type { PhotoItem } from "@/app/(app)/devices/_components/photo-gallery";
import type { DocumentItem } from "@/app/(app)/devices/_components/document-list";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function EditDevicePage({ params }: PageProps) {
  const { code } = use(params);
  const decodedCode = decodeURIComponent(code);
  const tForm = useTranslations("devices.form");

  const deviceQ = useDeviceByCode(decodedCode);
  const groups = useGroups();
  const depts = useDepartments();
  const mfrs = useManufacturers();
  const photosQ = useDevicePhotos(deviceQ.data?.id ?? "");
  const docsQ = useDeviceDocuments(deviceQ.data?.id ?? "");

  const photoPaths = (photosQ.data ?? []).map((p) => p.url);
  const docPaths = (docsQ.data ?? []).map((d) => d.url);
  const photoUrlsQ = useSignedPhotoUrls(photoPaths);
  const docUrlsQ = useSignedDocumentUrls(docPaths);

  if (
    deviceQ.isPending || groups.isPending || depts.isPending || mfrs.isPending ||
    photosQ.isPending || docsQ.isPending
  ) {
    return (
      <div className="px-7 py-7 space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }
  if (!deviceQ.data) notFound();

  const device = deviceQ.data;
  const photoRows = photosQ.data ?? [];
  const docRows = docsQ.data ?? [];
  const photoUrlMap = photoUrlsQ.data ?? {};
  void (docUrlsQ.data ?? {});

  const initialPhotos: PhotoItem[] = photoRows.map((p) => ({
    key: p.id,
    dbId: p.id,
    storagePath: p.url,
    previewUrl: photoUrlMap[p.url] ?? "",
    fileName: p.fileName,
    sizeBytes: p.sizeBytes,
  }));
  const initialDocuments: DocumentItem[] = docRows.map((d) => ({
    key: d.id,
    dbId: d.id,
    storagePath: d.url,
    fileName: d.fileName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
  }));

  const initialValues: DeviceFormValues = {
    name: device.name,
    code: device.code,
    groupId: device.groupId,
    departmentId: device.departmentId,
    manufacturerId: device.manufacturerId,
    model: device.model ?? "",
    serialNumber: device.serialNumber ?? "",
    specifications: device.specifications ?? "",
    notes: device.notes ?? "",
    condition: device.condition,
    location: device.location ?? "",
    quantity: device.quantity,
    unit: device.unit,
    source: device.source,
    status: device.status,
    importDate: device.importDate,
    lastCheckDate: device.lastCheckDate,
    inventoryCycleMonths: device.inventoryCycleMonths,
    warrantyStart: device.warrantyStart,
    warrantyEnd: device.warrantyEnd,
  };

  const headerGroupIcon = (groups.data ?? []).find((g) => g.id === device.groupId)?.icon ?? null;

  return (
    <DeviceForm
      mode="edit"
      deviceId={device.id}
      initialValues={initialValues}
      initialPhotos={initialPhotos}
      initialDocuments={initialDocuments}
      groups={groups.data ?? []}
      departments={depts.data ?? []}
      manufacturers={mfrs.data ?? []}
      pageTitle={tForm("editPageTitle", { name: device.name })}
      pageSubtitle={device.code}
      headerGroupIcon={headerGroupIcon}
    />
  );
}
```

- [ ] **Step 10: Switch `device-form.tsx` off server actions**

Open `client/src/app/(app)/devices/_components/device-form.tsx`. Locate every action call (search for `Action(`):

```bash
grep -n "Action(" client/src/app/\(app\)/devices/_components/device-form.tsx
```

Expected: `createDeviceAction`, `updateDeviceAction`, `deleteDeviceAction`, `insertPhotosAction`, `reorderPhotosAction`, `removePhotoAction`, `setCoverPhotoAction`, `insertDocumentsAction`, `removeDocumentAction`.

Replace the action imports with hook imports:

```tsx
import { useRouter } from "next/navigation";
import { useCreateDevice } from "@/features/devices/hooks/use-create-device";
import { useUpdateDevice } from "@/features/devices/hooks/use-update-device";
import { useDeleteDevice } from "@/features/devices/hooks/use-delete-device";
import { useInsertPhotos } from "@/features/devices/hooks/use-insert-photos";
import { useReorderPhotos } from "@/features/devices/hooks/use-reorder-photos";
import { useRemovePhoto } from "@/features/devices/hooks/use-remove-photo";
import { useSetCoverPhoto } from "@/features/devices/hooks/use-set-cover-photo";
import { useInsertDocuments } from "@/features/devices/hooks/use-insert-documents";
import { useRemoveDocument } from "@/features/devices/hooks/use-remove-document";
```

Inside the component:

```tsx
const router = useRouter();
const createDevice = useCreateDevice();
const updateDevice = useUpdateDevice();
const deleteDevice = useDeleteDevice();
const insertPhotos = useInsertPhotos();
const reorderPhotos = useReorderPhotos();
const removePhoto = useRemovePhoto();
const setCoverPhoto = useSetCoverPhoto();
const insertDocuments = useInsertDocuments();
const removeDocument = useRemoveDocument();
```

Replacement patterns at each call site:

- `await createDeviceAction(values)` →
  ```tsx
  const device = await createDevice.mutateAsync(values);
  // existing post-create logic (photos, docs) using device.id
  ```
- `await updateDeviceAction(id, values)` →
  ```tsx
  const device = await updateDevice.mutateAsync({ id, values });
  ```
- `await deleteDeviceAction(id)` (note the original also `redirect`s):
  ```tsx
  await deleteDevice.mutateAsync(id);
  router.push("/devices");
  ```
- `await insertPhotosAction(deviceId, photos)` →
  ```tsx
  const rows = await insertPhotos.mutateAsync({ deviceId, photos });
  ```
- `await reorderPhotosAction(rows)` →
  ```tsx
  await reorderPhotos.mutateAsync({ deviceId, rows });
  ```
- `await removePhotoAction(photoId, storagePath)` →
  ```tsx
  await removePhoto.mutateAsync({ deviceId, photoId, storagePath });
  ```
- `await setCoverPhotoAction(deviceId, photoId)` →
  ```tsx
  await setCoverPhoto.mutateAsync({ deviceId, photoId });
  ```
- `await insertDocumentsAction(deviceId, docs)` →
  ```tsx
  await insertDocuments.mutateAsync({ deviceId, docs });
  ```
- `await removeDocumentAction(docId, storagePath)` →
  ```tsx
  await removeDocument.mutateAsync({ deviceId, docId, storagePath });
  ```

Wrap each in try/catch with the existing toast-error fallback (`tCommon("saveFailed")` / `tCommon("deleteFailed")`).

The shape of `ActionResult` (`{ ok, deviceId, code, fieldErrors }`) used to be inspected at call sites — replace those with: success path uses `device.id`/`device.code` from the returned object; error path lands in the catch block.

- [ ] **Step 11: Delete the devices actions file**

```bash
rm client/src/app/\(app\)/devices/_actions.ts
```

- [ ] **Step 12: Build + smoke test**

```bash
pnpm --filter client build && pnpm --filter client dev
```

Verify:
- [ ] `/devices/<code>` — skeleton, then identical detail page; photos render via signed URLs; documents open via signed URLs
- [ ] `/devices/new` — submit creates device, photos and docs uploaded, redirected to `/devices/<code>`
- [ ] `/devices/<code>/edit` — open, change a field, save → redirected; reorder/remove photo and document work
- [ ] Delete device from edit page → redirected to `/devices`, gone from list

- [ ] **Step 13: Commit**

```bash
git add client/src/features/devices client/src/features/groups/hooks/use-group.ts client/src/features/departments/hooks/use-department.ts client/src/features/manufacturers/hooks/use-manufacturer.ts client/src/app/\(app\)/devices
git commit -m "feat(devices): migrate detail and form pages to client-side queries and mutations"
```

---

## Task 11: Cleanup — delete legacy data layer

**Files:**
- Delete: `client/src/lib/data/activity.ts`, `departments.ts`, `devices.ts`, `groups.ts`, `manufacturers.ts`, `members.ts`, `settings.ts`, `storage.ts`, `_filter.ts`
- Keep: `client/src/lib/data/auth.ts`

- [ ] **Step 1: Confirm no remaining imports**

```bash
grep -rE "from \"@/lib/data/(activity|departments|devices|groups|manufacturers|members|settings|storage|_filter)\"" client/src --include="*.ts" --include="*.tsx"
```

Expected: no output. If anything remains, fix it before deleting.

- [ ] **Step 2: Confirm no remaining server-action callers**

```bash
grep -rE "from \"@/app/\(app\)/.*/_actions\"" client/src --include="*.ts" --include="*.tsx"
```

Expected: no output.

- [ ] **Step 3: Confirm no remaining `_actions.ts` files exist**

```bash
ls client/src/app/\(app\)/*/_actions.ts 2>/dev/null
```

Expected: no output.

- [ ] **Step 4: Delete the orphaned data files**

```bash
rm client/src/lib/data/activity.ts \
   client/src/lib/data/departments.ts \
   client/src/lib/data/devices.ts \
   client/src/lib/data/groups.ts \
   client/src/lib/data/manufacturers.ts \
   client/src/lib/data/members.ts \
   client/src/lib/data/settings.ts \
   client/src/lib/data/storage.ts \
   client/src/lib/data/_filter.ts
```

Confirm `auth.ts` remains:

```bash
ls client/src/lib/data/
```

Expected: only `auth.ts`.

- [ ] **Step 5: Final `"server-only"` audit**

```bash
grep -rE "\"server-only\"|'server-only'" client/src --include="*.ts" --include="*.tsx"
```

Expected: matches only in `client/src/lib/data/auth.ts` and `client/src/lib/supabase/server.ts` (if it uses it) — and **nowhere** in pages or feature folders. Anywhere else is a leak.

- [ ] **Step 6: Final build + smoke test**

```bash
pnpm --filter client build && pnpm --filter client dev
```

Walk through every page:
- [ ] `/overview`
- [ ] `/devices` (with filters in URL)
- [ ] `/devices/<code>`
- [ ] `/devices/new`
- [ ] `/devices/<code>/edit`
- [ ] `/groups`
- [ ] `/departments`
- [ ] `/manufacturers`
- [ ] `/members`
- [ ] `/members/<id>`
- [ ] `/settings`

For each: skeleton flashes → identical layout → at least one CRUD action works → reload survives → back-nav shows cached data.

- [ ] **Step 7: Confirm logout-then-visit-any-app-page still redirects via server**

Open an incognito window, navigate to `http://localhost:3000/overview`. Expected: server-side redirect to `/login` before any client JS runs (no skeleton appears).

- [ ] **Step 8: Commit**

```bash
git add -u client/src/lib/data
git commit -m "chore(data): remove legacy server-side data layer (kept auth.ts for layout)"
```

---

## Verification across the whole change

After Task 11, run this final audit from the repo root:

```bash
# No async page components in (app) except layout
grep -rE "^export default async function" client/src/app/\(app\) --include="*.tsx" | grep -v "layout.tsx"
# Expected: no output

# No server-action files
find client/src/app/\(app\) -name "_actions.ts"
# Expected: no output

# Every (app) page is a client component
grep -L "\"use client\"" client/src/app/\(app\)/*/page.tsx client/src/app/\(app\)/*/*/page.tsx client/src/app/\(app\)/*/*/*/page.tsx 2>/dev/null
# Expected: only layout.tsx paths (no page.tsx in the output)

# Total commit count for the feature branch
git log main..HEAD --oneline | wc -l
# Expected: around 10
```

If all three checks pass, the migration is complete.

---

## Risks (recap from spec)

- **RLS coverage** — every browser-side write goes through anon-key + RLS. The plan touches: `device`, `device_photo`, `device_document`, `device_group`, `department`, `manufacturer`, `member`, `org_settings`, `user_preference`, `activity`, plus storage buckets `device-photos` and `device-documents`. If any policy is missing an `insert`/`update`/`delete` clause for the calling role, the mutation will silently fail. Address out-of-band before merge.
- **Cold first paint** — first visit to any page now shows a skeleton instead of SSR-rendered content. Accepted.
- **Devices filters via URL** — `/devices?status=in-use` keeps working but is now read client-side. Confirm during Task 9 smoke test.

## Self-review

- Each spec section maps to ≥1 task: auth gate (kept untouched, Task 11 Step 7), bulletproof folders (Tasks 2–10), key factory (Task 1), migration of data fns (Tasks 3–10), mutations direct + delete `_actions.ts` (Tasks 3–10), client pages with skeletons (Tasks 3–10), file-by-file summary table (Tasks 3, 4, 5, 6, 7, 8, 9, 10, 11).
- No placeholders, no "TODO", no "similar to Task N" — every replacement step shows the actual code.
- Function/hook names are consistent across tasks: `useDevices`, `useDeviceByCode`, `useGroupsWithCounts`, `useSaveGroup`, `useDeleteGroup`, `useBulkUpdateStatus`, `useBulkDelete`, etc.
- Type imports for `keys.ts` (Task 1 Step 1) are forward-referenced; the file is only consumed once the referenced features exist (starting Task 3). Build-safe because nothing imports `keys.ts` until then.
- Tasks 6 and 7 intentionally leave the tree non-building until Task 8 lands `useDevices`. This is called out at the end of each affected task.
