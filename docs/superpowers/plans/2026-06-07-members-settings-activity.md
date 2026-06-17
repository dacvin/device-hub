# Members, Settings & Activity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the handoff revision adding members, settings, and activity (DB + 4 new screens + shared primitives + RLS).

**Architecture:** Schema additions split into `supabase/schemas/08_members.sql`, `09_settings.sql`, `10_activity.sql` (modify `03_view.sql`, `04_functions.sql`, `06_rls.sql`); single migration generated via `supabase db diff`. Domain types in `lib/domain/*`, server-only data access in `lib/data/*`. New routes under `app/(app)/`: `/overview`, `/members`, `/members/[id]`, `/settings`. App-layer `logActivity()` helper called from every mutating Server Action. RLS policies enforce the role matrix from the handoff.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (Postgres + Auth + RLS), shadcn/ui, Tailwind v4, next-intl, Sonner, TanStack Query/Table, Zod.

**Verification model (no unit tests in this codebase):** every phase ends with `tsc --noEmit` + `pnpm lint` clean; DB phases reset and re-apply via `supabase db reset`; screens manually smoke-tested in dev server; each finished screen verified against its mock by a dispatched subagent (per `feedback_ui_fidelity_subagent_verify`).

**Fidelity rule (applies to every subagent UI check in this plan):** the **HTML file is the definitive source of truth** — match layout, components, copy, classes, and behavior exactly to the mock HTML. Screenshots in `screenshots/` are reference only (they help interpret intent; they are NOT pixel targets). When the subagent reports differences, fix the implementation to match the HTML.

**Spec:** `docs/superpowers/specs/2026-06-07-members-settings-activity-design.md`

---

## Phase 0: Setup

### Task 0.1: Install missing shadcn primitives

**Files:**
- Modify: `client/src/components/ui/skeleton.tsx` (new via shadcn)
- Modify: `client/src/components/ui/progress.tsx` (new via shadcn)
- Modify: `client/src/components/ui/popover.tsx` (new via shadcn)

- [ ] **Step 1: Add the three shadcn components**

From `client/`, run:
```bash
pnpm dlx shadcn@latest add skeleton progress popover
```

- [ ] **Step 2: Verify**

```bash
ls src/components/ui/skeleton.tsx src/components/ui/progress.tsx src/components/ui/popover.tsx
pnpm lint
```
Expected: three files exist, lint passes.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui/skeleton.tsx client/src/components/ui/progress.tsx client/src/components/ui/popover.tsx client/components.json client/package.json client/pnpm-lock.yaml
git commit -m "chore(ui): add shadcn skeleton, progress, popover"
```

---

## Phase 1: Schema

All SQL goes into `supabase/schemas/`. **Never hand-author files in `supabase/migrations/`** (per `feedback_schema_workflow`). The single migration is generated at the end of the phase via `supabase db diff`.

### Task 1.1: Add members schema

**Files:**
- Create: `supabase/schemas/08_members.sql`

- [ ] **Step 1: Write the schema file**

```sql
-- ============================================================
-- DeviceHub — members & access
-- member.id is the SAME uuid as auth.users.id (populated on first sign-in
-- by the auth callback). RLS uses auth.uid() directly.
-- ============================================================

create type member_role   as enum ('it_admin', 'manager', 'viewer');
create type member_status as enum ('active', 'invited', 'disabled');

create table member (
  id             uuid primary key,                                       -- = auth.users.id
  name           text not null,
  email          text not null unique,
  role           member_role   not null default 'viewer',
  status         member_status not null default 'invited',

  department_id  uuid references department(id) on delete set null,
  site           text,
  phone          text,
  reports_to     uuid references member(id) on delete set null,

  joined_at      date,
  last_active_at timestamptz,
  invited_by     uuid references member(id) on delete set null,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index member_department_idx on member(department_id);
create index member_role_idx       on member(role);

create function member_role_label(r member_role) returns text
language sql immutable as $$
  select case r
    when 'it_admin' then 'IT Admin'
    when 'manager'  then 'Manager'
    when 'viewer'   then 'Viewer'
  end;
$$;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/schemas/08_members.sql
git commit -m "feat(db): add member table, role/status enums, role-label fn"
```

### Task 1.2: Add settings schema and replace flags view with function

**Files:**
- Create: `supabase/schemas/09_settings.sql`
- Modify: `supabase/schemas/03_view.sql`

- [ ] **Step 1: Remove the existing `device_with_flags` view**

Replace the entire contents of `supabase/schemas/03_view.sql` with:

```sql
-- ============================================================
-- DeviceHub — derived FLAGS
-- The original view hardcoded a 90-day warranty window. Now that
-- the window is configurable (org_settings.warranty_expiring_days),
-- flag derivation lives in the function `devices_with_flags(int)`
-- defined in 09_settings.sql.
-- ============================================================

-- (intentionally empty — view definition replaced by function)
```

- [ ] **Step 2: Write the settings schema file**

Create `supabase/schemas/09_settings.sql`:

```sql
-- ============================================================
-- DeviceHub — org settings + per-user prefs + devices_with_flags()
-- ============================================================

create table org_settings (
  id                              boolean primary key default true check (id),  -- singleton guard

  org_name                        text not null default 'Sioux Asia',
  primary_site                    text,
  date_format                     text not null default 'DD MMM YYYY',

  code_prefix                     text not null default 'DEV-',
  code_autogenerate               boolean not null default true,
  default_inventory_cycle_months  int not null default 12 check (default_inventory_cycle_months between 1 and 120),

  condition_good_pct              int not null default 70 check (condition_good_pct between 0 and 100),
  condition_fair_pct              int not null default 40 check (condition_fair_pct between 0 and 100),
  check (condition_fair_pct <= condition_good_pct),

  warranty_expiring_days          int not null default 90 check (warranty_expiring_days between 1 and 365),

  notify_warranty                 boolean not null default true,
  notify_inventory_overdue        boolean not null default true,
  notify_weekly_summary           boolean not null default true,
  notify_new_device               boolean not null default false,

  export_format                   text not null default 'CSV' check (export_format in ('CSV', 'XLSX', 'PDF')),
  deleted_retention_days          int not null default 30 check (deleted_retention_days between 0 and 3650),

  updated_by                      uuid references member(id) on delete set null,
  updated_at                      timestamptz not null default now()
);

insert into org_settings (id) values (true);

create table user_preference (
  user_id              uuid primary key references member(id) on delete cascade,
  theme                text not null default 'system' check (theme in ('light', 'dark', 'system')),
  default_device_view  text not null default 'table'  check (default_device_view in ('table', 'cards')),
  mono_codes           boolean not null default true,
  updated_at           timestamptz not null default now()
);

-- Parameterized replacement for the dropped device_with_flags view.
-- security_invoker semantics: RLS evaluates against the caller.
create function devices_with_flags(p_warranty_days int default 90)
returns table (
  like device,
  flag_warranty_expiring boolean,
  flag_inventory_overdue boolean
)
language sql stable security invoker as $$
  select d.*,
    (d.status <> 'retired'
     and d.warranty_end is not null
     and d.warranty_end >= current_date
     and d.warranty_end <= current_date + (p_warranty_days || ' days')::interval) as flag_warranty_expiring,
    (d.status <> 'retired'
     and d.last_check_date is not null
     and d.last_check_date < current_date
         - (d.inventory_cycle_months || ' months')::interval)                     as flag_inventory_overdue
  from device d;
$$;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/schemas/03_view.sql supabase/schemas/09_settings.sql
git commit -m "feat(db): add org_settings, user_preference, devices_with_flags() fn"
```

### Task 1.3: Add activity schema

**Files:**
- Create: `supabase/schemas/10_activity.sql`

- [ ] **Step 1: Write the schema file**

```sql
-- ============================================================
-- DeviceHub — activity log
-- One row per mutation, written by the app-layer logActivity() helper.
-- ============================================================

create type activity_action as enum (
  'device.created', 'device.updated', 'device.status_changed',
  'device.deleted', 'device.restored',
  'device.inventory_checked', 'device.allocated',
  'member.invited', 'member.role_changed', 'member.removed',
  'catalog.created', 'catalog.updated', 'catalog.deleted',
  'settings.updated'
);

create table activity (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references member(id) on delete set null,
  action       activity_action not null,
  entity_type  text not null,
  entity_id    uuid,
  entity_label text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index activity_created_idx ON activity(created_at desc);
create index activity_entity_idx  ON activity(entity_type, entity_id, created_at desc);
create index activity_actor_idx   ON activity(actor_id, created_at desc);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/schemas/10_activity.sql
git commit -m "feat(db): add activity log table + activity_action enum"
```

### Task 1.4: Add role-gating helper functions

**Files:**
- Modify: `supabase/schemas/04_functions.sql`

- [ ] **Step 1: Append the helpers to `04_functions.sql`**

Read the file first to see existing contents, then append:

```sql
-- ============================================================
-- Role-gating helpers used by RLS policies.
-- STABLE so they're cached within a statement; SECURITY DEFINER
-- so they see the member row even when RLS would otherwise hide it.
-- ============================================================

create function app_role() returns member_role
language sql stable security definer set search_path = public as $$
  select role from member where id = auth.uid();
$$;

create function app_dept() returns uuid
language sql stable security definer set search_path = public as $$
  select department_id from member where id = auth.uid();
$$;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/schemas/04_functions.sql
git commit -m "feat(db): add app_role() / app_dept() RLS helpers"
```

### Task 1.5: RLS policies for new tables and tightened device policies

**Files:**
- Modify: `supabase/schemas/06_rls.sql`

- [ ] **Step 1: Read the current `06_rls.sql`**

Before writing, read the file to understand existing policies — keep what's there for `device_photo`/`device_document` etc., and modify/append what the role matrix requires.

- [ ] **Step 2: Add policies per the role matrix**

Append to `supabase/schemas/06_rls.sql` (drop existing device write policies first if they're permissive):

```sql
-- ============================================================
-- Member, settings, preferences, activity — RLS
-- ============================================================

alter table member          enable row level security;
alter table org_settings    enable row level security;
alter table user_preference enable row level security;
alter table activity        enable row level security;

-- Member: everyone reads; only IT admins write; every member can read/update their own row.
create policy member_read_all        on member for select using (true);
create policy member_write_admin     on member for insert with check (app_role() = 'it_admin');
create policy member_update_admin    on member for update using (app_role() = 'it_admin') with check (app_role() = 'it_admin');
create policy member_update_self     on member for update using (id = auth.uid()) with check (id = auth.uid());
create policy member_delete_admin    on member for delete using (app_role() = 'it_admin');

-- org_settings: read all, write admin only
create policy org_settings_read       on org_settings for select using (true);
create policy org_settings_write      on org_settings for update using (app_role() = 'it_admin') with check (app_role() = 'it_admin');

-- user_preference: each user sees and edits only their own row
create policy user_pref_self_read   on user_preference for select using (user_id = auth.uid());
create policy user_pref_self_insert on user_preference for insert with check (user_id = auth.uid());
create policy user_pref_self_update on user_preference for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- activity: read for all authenticated, write only via service role (no insert policy = blocked under RLS for normal users)
create policy activity_read_all on activity for select using (auth.role() = 'authenticated');

-- ============================================================
-- Tighten device + catalog write policies to the role matrix
-- ============================================================

-- Drop any pre-existing permissive policies. (Adjust names if different — check first.)
drop policy if exists device_write_all on device;

create policy device_read  on device for select using (true);
create policy device_write on device for all using (
  app_role() = 'it_admin'
  or (app_role() = 'manager' and department_id = app_dept())
) with check (
  app_role() = 'it_admin'
  or (app_role() = 'manager' and department_id = app_dept())
);

-- Photos and documents inherit the parent device's policy.
create policy device_photo_read on device_photo for select using (true);
create policy device_photo_write on device_photo for all using (
  exists (select 1 from device d where d.id = device_photo.device_id
          and (app_role() = 'it_admin'
               or (app_role() = 'manager' and d.department_id = app_dept())))
);

create policy device_document_read on device_document for select using (true);
create policy device_document_write on device_document for all using (
  exists (select 1 from device d where d.id = device_document.device_id
          and (app_role() = 'it_admin'
               or (app_role() = 'manager' and d.department_id = app_dept())))
);

-- Catalogs: all read; writes admin only
create policy department_read         on department for select using (true);
create policy department_write_admin  on department for all using (app_role() = 'it_admin') with check (app_role() = 'it_admin');

create policy device_group_read         on device_group for select using (true);
create policy device_group_write_admin  on device_group for all using (app_role() = 'it_admin') with check (app_role() = 'it_admin');

create policy manufacturer_read         on manufacturer for select using (true);
create policy manufacturer_write_admin  on manufacturer for all using (app_role() = 'it_admin') with check (app_role() = 'it_admin');
```

**Note to executor:** if `06_rls.sql` already contains policies with the same names, drop-and-replace them. Read the file before appending.

- [ ] **Step 3: Commit**

```bash
git add supabase/schemas/06_rls.sql
git commit -m "feat(db): RLS policies per role matrix (member, settings, activity, devices)"
```

### Task 1.6: Generate the consolidated migration

**Files:**
- Create: `supabase/migrations/<timestamp>_members_settings_activity.sql` (output of `supabase db diff`)

- [ ] **Step 1: Run db diff**

From repo root:
```bash
supabase db diff --schema public -f members_settings_activity
```

This compares the current local DB to the declared schema in `supabase/schemas/` and writes a timestamped migration file.

- [ ] **Step 2: Inspect the generated migration**

```bash
ls -la supabase/migrations/
cat supabase/migrations/<new-timestamp>_members_settings_activity.sql | head -80
```

Verify it includes: enum creations (`member_role`, `member_status`, `activity_action`), table creations (`member`, `org_settings`, `user_preference`, `activity`), function `devices_with_flags`, helper fns `app_role`/`app_dept`, RLS enables and policies, and the `drop view device_with_flags` statement.

- [ ] **Step 3: Reset local DB and re-apply all migrations**

```bash
supabase db reset
```

Expected output ends with `Finished supabase db reset on branch main.` and no errors. The seed and the new migration both apply cleanly.

- [ ] **Step 4: Regenerate TypeScript types**

```bash
cd client && pnpm db:gen-types
```

This rewrites `client/src/types/database.types.ts`. Verify it now contains `member`, `org_settings`, `user_preference`, `activity` types; `Functions` includes `devices_with_flags`, `app_role`, `app_dept`, `member_role_label`; `device_with_flags` no longer appears as a view.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/<new-timestamp>_members_settings_activity.sql client/src/types/database.types.ts
git commit -m "feat(db): generate migration for members/settings/activity"
```

---

## Phase 2: Patch the existing device data path

The dropped `device_with_flags` view breaks `lib/data/devices.ts`. Switch it to the RPC function and thread the warranty window from `org_settings`.

### Task 2.1: Add settings data module (minimal — just the read used by devices)

**Files:**
- Create: `client/src/lib/domain/settings.ts`
- Create: `client/src/lib/data/settings.ts`

- [ ] **Step 1: Domain types**

Create `client/src/lib/domain/settings.ts`:

```typescript
import { z } from "zod";
import type { Database } from "@/types/database.types";

export type OrgSettingsRow = Database["public"]["Tables"]["org_settings"]["Row"];
export type UserPreferenceRow = Database["public"]["Tables"]["user_preference"]["Row"];

export interface OrgSettings {
  orgName: string;
  primarySite: string | null;
  dateFormat: string;
  codePrefix: string;
  codeAutogenerate: boolean;
  defaultInventoryCycleMonths: number;
  conditionGoodPct: number;
  conditionFairPct: number;
  warrantyExpiringDays: number;
  notifyWarranty: boolean;
  notifyInventoryOverdue: boolean;
  notifyWeeklySummary: boolean;
  notifyNewDevice: boolean;
  exportFormat: "CSV" | "XLSX" | "PDF";
  deletedRetentionDays: number;
  updatedBy: string | null;
  updatedAt: string;
}

export interface UserPreference {
  userId: string;
  theme: "light" | "dark" | "system";
  defaultDeviceView: "table" | "cards";
  monoCodes: boolean;
  updatedAt: string;
}

export function mapOrgSettingsRow(row: OrgSettingsRow): OrgSettings {
  return {
    orgName: row.org_name,
    primarySite: row.primary_site,
    dateFormat: row.date_format,
    codePrefix: row.code_prefix,
    codeAutogenerate: row.code_autogenerate,
    defaultInventoryCycleMonths: row.default_inventory_cycle_months,
    conditionGoodPct: row.condition_good_pct,
    conditionFairPct: row.condition_fair_pct,
    warrantyExpiringDays: row.warranty_expiring_days,
    notifyWarranty: row.notify_warranty,
    notifyInventoryOverdue: row.notify_inventory_overdue,
    notifyWeeklySummary: row.notify_weekly_summary,
    notifyNewDevice: row.notify_new_device,
    exportFormat: row.export_format as OrgSettings["exportFormat"],
    deletedRetentionDays: row.deleted_retention_days,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

export function mapUserPreferenceRow(row: UserPreferenceRow): UserPreference {
  return {
    userId: row.user_id,
    theme: row.theme as UserPreference["theme"],
    defaultDeviceView: row.default_device_view as UserPreference["defaultDeviceView"],
    monoCodes: row.mono_codes,
    updatedAt: row.updated_at,
  };
}

export const orgSettingsSchema = z.object({
  orgName: z.string().min(1).max(120),
  primarySite: z.string().max(120).nullable(),
  dateFormat: z.string().min(1),
  codePrefix: z.string().min(1).max(16),
  codeAutogenerate: z.boolean(),
  defaultInventoryCycleMonths: z.number().int().min(1).max(120),
  conditionGoodPct: z.number().int().min(0).max(100),
  conditionFairPct: z.number().int().min(0).max(100),
  warrantyExpiringDays: z.number().int().min(1).max(365),
  notifyWarranty: z.boolean(),
  notifyInventoryOverdue: z.boolean(),
  notifyWeeklySummary: z.boolean(),
  notifyNewDevice: z.boolean(),
  exportFormat: z.enum(["CSV", "XLSX", "PDF"]),
  deletedRetentionDays: z.number().int().min(0).max(3650),
}).refine(v => v.conditionFairPct <= v.conditionGoodPct, {
  message: "Fair threshold must be ≤ Good threshold",
  path: ["conditionFairPct"],
});

export type OrgSettingsInput = z.infer<typeof orgSettingsSchema>;

export const userPreferenceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  defaultDeviceView: z.enum(["table", "cards"]),
  monoCodes: z.boolean(),
});

export type UserPreferenceInput = z.infer<typeof userPreferenceSchema>;
```

- [ ] **Step 2: Data module (read-only for now)**

Create `client/src/lib/data/settings.ts`:

```typescript
import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  type OrgSettings,
  type UserPreference,
  mapOrgSettingsRow,
  mapUserPreferenceRow,
} from "@/lib/domain/settings";

export const getOrgSettings = cache(async (): Promise<OrgSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw error;
  return mapOrgSettingsRow(data);
});

export const getUserPreference = cache(async (userId: string): Promise<UserPreference | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_preference")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapUserPreferenceRow(data) : null;
});
```

- [ ] **Step 3: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/domain/settings.ts client/src/lib/data/settings.ts
git commit -m "feat(data): org_settings + user_preference read helpers"
```

### Task 2.2: Switch device reads to `devices_with_flags()` RPC

**Files:**
- Modify: `client/src/lib/data/devices.ts`

- [ ] **Step 1: Replace both `.from("device_with_flags")` call sites**

Read the file first. At line 30 (in `listDevices`) and line 58 (in `getDeviceWithFlagsByCode`), the current code is:

```typescript
let q = supabase
  .from("device_with_flags")
  .select("*")
  ...
```

Replace with an RPC call. Add an import at the top:

```typescript
import { getOrgSettings } from "@/lib/data/settings";
```

For `listDevices`, change the query base to:

```typescript
const settings = await getOrgSettings();
let q = supabase
  .rpc("devices_with_flags", { p_warranty_days: settings.warrantyExpiringDays })
  .select("*")
  .is("deleted_at", null)
  .order("updated_at", { ascending: false });
```

For `getDeviceWithFlagsByCode`, the same pattern:

```typescript
const settings = await getOrgSettings();
const { data, error } = await supabase
  .rpc("devices_with_flags", { p_warranty_days: settings.warrantyExpiringDays })
  .select("*")
  .eq("code", code)
  .maybeSingle();
```

**Note:** RPC return columns match the original view (device columns + `flag_warranty_expiring` + `flag_inventory_overdue`), so the existing `mapDeviceWithFlagsRow` mapper should still apply. Verify types compile.

- [ ] **Step 2: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint
```

Then start dev server and smoke-test:
```bash
pnpm dev
```
Navigate to `/devices`. Expected: device list renders, flag chips appear as before.

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/data/devices.ts
git commit -m "refactor(data): switch device reads from view to devices_with_flags() rpc"
```

---

## Phase 3: Domain + data modules

### Task 3.1: Members domain

**Files:**
- Create: `client/src/lib/domain/members.ts`

- [ ] **Step 1: Write the module**

```typescript
import { z } from "zod";
import type { Database } from "@/types/database.types";

export type MemberRow = Database["public"]["Tables"]["member"]["Row"];
export type MemberRole = MemberRow["role"];
export type MemberStatus = MemberRow["status"];

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  departmentId: string | null;
  departmentName: string | null;
  site: string | null;
  phone: string | null;
  reportsTo: string | null;
  reportsToName: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  invitedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ROLE_LABEL: Record<MemberRole, string> = {
  it_admin: "IT Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export const ROLE_TONE: Record<MemberRole, "primary" | "secondary" | "muted"> = {
  it_admin: "primary",
  manager: "secondary",
  viewer: "muted",
};

export type Capability =
  | "viewInventory"
  | "manageOwnDept"
  | "manageAllDevices"
  | "manageCatalogs"
  | "exportData"
  | "manageMembers"
  | "changeSettings";

export const CAPABILITIES: Record<MemberRole, Record<Capability, boolean>> = {
  it_admin: {
    viewInventory: true, manageOwnDept: true, manageAllDevices: true,
    manageCatalogs: true, exportData: true, manageMembers: true, changeSettings: true,
  },
  manager: {
    viewInventory: true, manageOwnDept: true, manageAllDevices: false,
    manageCatalogs: false, exportData: true, manageMembers: false, changeSettings: false,
  },
  viewer: {
    viewInventory: true, manageOwnDept: false, manageAllDevices: false,
    manageCatalogs: false, exportData: false, manageMembers: false, changeSettings: false,
  },
};

export function can(role: MemberRole, capability: Capability): boolean {
  return CAPABILITIES[role][capability];
}

// shape returned by the joined select in lib/data/members.ts
type MemberJoinedRow = MemberRow & {
  department: { name: string } | null;
  reports_to_member: { name: string } | null;
};

export function mapMemberRow(row: MemberJoinedRow): Member {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    departmentId: row.department_id,
    departmentName: row.department?.name ?? null,
    site: row.site,
    phone: row.phone,
    reportsTo: row.reports_to,
    reportsToName: row.reports_to_member?.name ?? null,
    joinedAt: row.joined_at,
    lastActiveAt: row.last_active_at,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const inviteMemberSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().regex(/@sioux\.asia$/i, "Email must be a @gmail.com address"),
  role: z.enum(["it_admin", "manager", "viewer"]),
  departmentId: z.string().uuid().nullable(),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
```

- [ ] **Step 2: Verify**

```bash
cd client && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/domain/members.ts
git commit -m "feat(domain): member types, role labels, capability matrix"
```

### Task 3.2: Members data

**Files:**
- Create: `client/src/lib/data/members.ts`

- [ ] **Step 1: Write the module**

```typescript
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mapMemberRow, type Member, type MemberRole } from "@/lib/domain/members";

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
  const supabase = await createClient();
  let q = supabase.from("member").select(memberSelect).order("name");

  if (filters.role && filters.role !== "all") {
    q = q.eq("role", filters.role);
  }
  if (filters.q) {
    const term = filters.q.trim();
    if (term) {
      q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
    }
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapMemberRow);
}

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member")
    .select(memberSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMemberRow(data) : null;
}

export async function countDevicesManagedBy(departmentId: string | null): Promise<number> {
  if (!departmentId) return 0;
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("device")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("department_id", departmentId);
  if (error) throw error;
  return count ?? 0;
}
```

- [ ] **Step 2: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/data/members.ts
git commit -m "feat(data): listMembers, getMemberById, countDevicesManagedBy"
```

### Task 3.3: Activity domain + data + `logActivity()` helper

**Files:**
- Create: `client/src/lib/domain/activity.ts`
- Create: `client/src/lib/data/activity.ts`

- [ ] **Step 1: Domain**

Create `client/src/lib/domain/activity.ts`:

```typescript
import type { Database } from "@/types/database.types";

export type ActivityRow = Database["public"]["Tables"]["activity"]["Row"];
export type ActivityAction = ActivityRow["action"];

export interface Activity {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const ACTIVITY_META: Record<ActivityAction, { icon: string; verbKey: string }> = {
  "device.created":            { icon: "plus",          verbKey: "deviceCreated" },
  "device.updated":            { icon: "pencil",        verbKey: "deviceUpdated" },
  "device.status_changed":     { icon: "activity",      verbKey: "deviceStatusChanged" },
  "device.deleted":            { icon: "trash-2",       verbKey: "deviceDeleted" },
  "device.restored":           { icon: "rotate-ccw",    verbKey: "deviceRestored" },
  "device.inventory_checked":  { icon: "clipboard-check", verbKey: "deviceInventoryChecked" },
  "device.allocated":          { icon: "user-plus",     verbKey: "deviceAllocated" },
  "member.invited":            { icon: "mail",          verbKey: "memberInvited" },
  "member.role_changed":       { icon: "shield",        verbKey: "memberRoleChanged" },
  "member.removed":            { icon: "user-minus",    verbKey: "memberRemoved" },
  "catalog.created":           { icon: "plus",          verbKey: "catalogCreated" },
  "catalog.updated":           { icon: "pencil",        verbKey: "catalogUpdated" },
  "catalog.deleted":           { icon: "trash-2",       verbKey: "catalogDeleted" },
  "settings.updated":          { icon: "settings",      verbKey: "settingsUpdated" },
};

type ActivityJoinedRow = ActivityRow & { actor: { name: string } | null };

export function mapActivityRow(row: ActivityJoinedRow): Activity {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor?.name ?? null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}
```

- [ ] **Step 2: Data + logActivity helper**

Create `client/src/lib/data/activity.ts`:

```typescript
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { type Activity, type ActivityAction, mapActivityRow } from "@/lib/domain/activity";

const activitySelect = `*, actor:actor_id(name)`;

export async function listRecentActivity(limit = 5): Promise<Activity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}

export async function listActivityForEntity(
  entityType: string,
  entityId: string,
  limit = 20,
): Promise<Activity[]> {
  const supabase = await createClient();
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

export async function listActivityByActor(actorId: string, limit = 20): Promise<Activity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}

export interface LogActivityInput {
  actorId: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string | null;
  entityLabel?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("activity").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    entity_label: input.entityLabel ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) {
    // Don't fail the parent mutation if activity logging fails — log and continue.
    console.error("logActivity failed", error);
  }
}
```

**Note on RLS:** the activity table only allows SELECT to authenticated users — no INSERT policy. To allow inserts from authenticated requests, add an INSERT policy in `06_rls.sql` (do this in Task 3.4 below), OR have `logActivity` use a service-role client. Choice for this plan: **add an INSERT policy** `activity_insert_authenticated for insert with check (auth.role() = 'authenticated')` — actor attribution is enforced by the app passing `actorId`, not by RLS.

- [ ] **Step 3: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/domain/activity.ts client/src/lib/data/activity.ts
git commit -m "feat(data): activity reads + logActivity() helper"
```

### Task 3.4: Open activity INSERT to authenticated users + regenerate migration

**Files:**
- Modify: `supabase/schemas/06_rls.sql`
- Create: `supabase/migrations/<timestamp>_activity_insert_policy.sql`

- [ ] **Step 1: Append the policy to `06_rls.sql`**

After the existing `activity_read_all` policy, add:

```sql
create policy activity_insert_authenticated on activity for insert
  with check (auth.role() = 'authenticated');
```

- [ ] **Step 2: Generate and apply the migration**

```bash
supabase db diff --schema public -f activity_insert_policy
supabase db reset
```

- [ ] **Step 3: Regenerate types**

```bash
cd client && pnpm db:gen-types
```

- [ ] **Step 4: Commit**

```bash
git add supabase/schemas/06_rls.sql supabase/migrations/*_activity_insert_policy.sql client/src/types/database.types.ts
git commit -m "feat(db): allow authenticated INSERT on activity (logActivity)"
```

### Task 3.5: `getCurrentMember()` auth helper

**Files:**
- Create: `client/src/lib/data/auth.ts`

- [ ] **Step 1: Write the helper**

```typescript
import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapMemberRow, type Member } from "@/lib/domain/members";

const memberSelect = `
  *,
  department:department_id(name),
  reports_to_member:reports_to(name)
`;

/**
 * The signed-in user's member row.
 * Returns null if the user has no member record (should not happen after
 * the auth-callback bootstrap; callers may treat null as "not allowed").
 */
export const getCurrentMember = cache(async (): Promise<Member | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("member")
    .select(memberSelect)
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMemberRow(data) : null;
});
```

- [ ] **Step 2: Verify**

```bash
cd client && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/data/auth.ts
git commit -m "feat(auth): getCurrentMember() server helper"
```

---

## Phase 4: Shell primitives

### Task 4.1: Mount Sonner Toaster in the app layout

**Files:**
- Modify: `client/src/app/(app)/layout.tsx`

- [ ] **Step 1: Add the Toaster mount**

The shadcn sonner wrapper is at `client/src/components/ui/sonner.tsx` — use that. Read it first to confirm the export name (`Toaster`).

In `layout.tsx`, import and render once near the root:

```tsx
import { Toaster } from "@/components/ui/sonner";
// ... existing imports ...

// inside the returned JSX, just before </div>:
<Toaster richColors position="bottom-right" />
```

- [ ] **Step 2: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint && pnpm dev
```

Smoke test: existing pages still load. Toaster is invisible until something fires.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/(app)/layout.tsx
git commit -m "feat(shell): mount Sonner Toaster in app layout"
```

### Task 4.2: AvatarMenu replaces the static user chip in sidebar

**Files:**
- Create: `client/src/components/app/avatar-menu.tsx`
- Modify: `client/src/components/app/sidebar.tsx`

- [ ] **Step 1: Create the AvatarMenu component**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CircleUser, Settings, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export interface AvatarMenuUser {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export function AvatarMenu({ user }: { user: AvatarMenuUser }) {
  const t = useTranslations("avatarMenu");
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md p-2 hover:bg-sidebar-accent text-left"
        >
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium leading-tight truncate">{user.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium leading-tight">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/members/${user.id}`}>
            <CircleUser className="size-4" aria-hidden />
            {t("viewProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" aria-hidden />
            {t("accountSettings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          {theme === "dark" ? t("lightMode") : t("darkMode")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="size-4" aria-hidden />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Modify the sidebar**

In `client/src/components/app/sidebar.tsx`:
- Change `SidebarUser` interface to include `id: string`.
- Replace the static `<div>` user chip block at the bottom with `<AvatarMenu user={user} />`.
- Import: `import { AvatarMenu } from "@/components/app/avatar-menu";`

- [ ] **Step 3: Modify the layout to pass `id`**

In `client/src/app/(app)/layout.tsx`, when constructing `sidebarUser`, include the auth user id (and prefer the `member.id` once we have it — which equals `auth.uid()`). For now:

```typescript
const sidebarUser: SidebarUser = {
  id: user.id,
  name: ...,
  email: ...,
  initials: ...,
};
```

- [ ] **Step 4: Add i18n keys**

Add to `client/src/messages/en.json` (top-level):

```json
"avatarMenu": {
  "viewProfile": "View profile",
  "accountSettings": "Account settings",
  "lightMode": "Light mode",
  "darkMode": "Dark mode",
  "signOut": "Sign out"
}
```

Mirror in `vi.json` with Vietnamese translations (the executor should ask the user for translations, or copy English placeholders and flag for review).

- [ ] **Step 5: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint && pnpm dev
```

Smoke: sign in, click the user chip in the sidebar bottom — menu opens; theme toggle flips light/dark; Sign out works.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/app/avatar-menu.tsx client/src/components/app/sidebar.tsx "client/src/app/(app)/layout.tsx" client/src/messages/en.json client/src/messages/vi.json
git commit -m "feat(shell): avatar menu (profile, settings, theme, sign out)"
```

### Task 4.3: `useConfirm` hook + ConfirmDialog

**Files:**
- Create: `client/src/components/app/confirm-dialog.tsx`
- Create: `client/src/hooks/use-confirm.tsx`

- [ ] **Step 1: Hook + provider**

Create `client/src/hooks/use-confirm.tsx`:

```tsx
"use client";

import { createContext, useCallback, useContext, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "destructive" | "warn";
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn | null>(null);

interface PendingState extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise((resolve) => setPending({ ...opts, resolve }));
  }, []);

  function handle(value: boolean) {
    pending?.resolve(value);
    setPending(null);
  }

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && handle(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
            {pending?.description ? (
              <AlertDialogDescription>{pending.description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handle(false)}>
              {pending?.cancelLabel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handle(true)}
              className={cn(
                pending?.tone === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {pending?.confirmLabel ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Ctx.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const fn = useContext(Ctx);
  if (!fn) throw new Error("useConfirm must be used within ConfirmProvider");
  return fn;
}
```

- [ ] **Step 2: Mount the provider in the app layout**

In `client/src/app/(app)/layout.tsx`, wrap children:

```tsx
import { ConfirmProvider } from "@/hooks/use-confirm";

// inside the layout:
<ConfirmProvider>
  <main className="flex-1 px-7 py-7">
    <div className="max-w-[1320px] mx-auto">{children}</div>
  </main>
</ConfirmProvider>
```

- [ ] **Step 3: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint && pnpm dev
```

Existing pages still render.

- [ ] **Step 4: Commit**

```bash
git add client/src/hooks/use-confirm.tsx "client/src/app/(app)/layout.tsx"
git commit -m "feat(shell): useConfirm hook + provider mounted in app layout"
```

### Task 4.4: State primitive components

**Files:**
- Create: `client/src/components/app/states/error-state.tsx`
- Create: `client/src/components/app/states/empty-state.tsx`
- Create: `client/src/components/app/states/permission-denied.tsx`

- [ ] **Step 1: Error state**

```tsx
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  requestId?: string;
}

export function ErrorState({ title, description, retryLabel = "Try again", onRetry, requestId }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertCircle className="size-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground max-w-md">{description}</p> : null}
      {onRetry ? (
        <Button onClick={onRetry} className="mt-5">{retryLabel}</Button>
      ) : null}
      {requestId ? (
        <p className="mt-4 text-xs text-muted-foreground font-mono">{requestId}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Empty state**

```tsx
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
}

export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-14 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4">
        <Icon className="size-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground max-w-md">{description}</p> : null}
      {actions?.length ? (
        <div className="mt-5 flex gap-2">
          {actions.map((a, i) =>
            a.href ? (
              <Button key={i} asChild variant={a.variant ?? "default"}>
                <a href={a.href}>{a.label}</a>
              </Button>
            ) : (
              <Button key={i} variant={a.variant ?? "default"} onClick={a.onClick}>{a.label}</Button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Permission denied**

```tsx
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PermissionDeniedProps {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  requestAccessHref?: string;
  requestAccessLabel?: string;
}

export function PermissionDenied({
  title, description,
  backHref = "/overview", backLabel = "Back to overview",
  requestAccessHref, requestAccessLabel = "Request access",
}: PermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-14 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4">
        <Lock className="size-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-5">{description}</p>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        {requestAccessHref ? (
          <Button asChild>
            <a href={requestAccessHref}>{requestAccessLabel}</a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/app/states/
git commit -m "feat(shell): state primitives (error, empty, permission-denied)"
```

### Task 4.5: Bulk action bar primitive

**Files:**
- Create: `client/src/components/app/bulk-action-bar.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

export interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  children: React.ReactNode;       // action buttons
  clearLabel?: string;
  countLabel: (n: number) => string;
}

export function BulkActionBar({ selectedCount, onClear, children, clearLabel = "Clear", countLabel }: BulkActionBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full border border-border bg-popover shadow-lg flex items-center gap-2 px-3 py-2"
      role="region"
      aria-label="Bulk actions"
    >
      <span className="px-2 text-sm font-medium">{countLabel(selectedCount)}</span>
      <div className="h-5 w-px bg-border" aria-hidden />
      {children}
      <div className="h-5 w-px bg-border" aria-hidden />
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground px-2"
        onClick={onClear}
      >
        {clearLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify & commit**

```bash
cd client && pnpm tsc --noEmit && pnpm lint
git add client/src/components/app/bulk-action-bar.tsx
git commit -m "feat(shell): floating bulk action bar primitive"
```

---

## Phase 5: Auth bootstrap

### Task 5.1: Upsert member on first sign-in

**Files:**
- Modify: `client/src/app/auth/callback/route.ts`

- [ ] **Step 1: Replace the existing route handler**

Read the existing file first. After `exchangeCodeForSession` succeeds, we need to:
1. Get the user.
2. Reject if email doesn't end with `@gmail.com`.
3. Upsert into `member` with `id := user.id`, `email`, `name` from metadata; on conflict, just touch `last_active_at`.

Replace the body after the successful `exchangeCodeForSession`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SIOUX_DOMAIN = /@sioux\.asia$/i;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/overview";

  if (!code) {
    url.pathname = "/login";
    url.search = "?error=oauth";
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    url.pathname = "/login";
    url.search = "?error=oauth";
    return NextResponse.redirect(url);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email || !SIOUX_DOMAIN.test(user.email)) {
    await supabase.auth.signOut();
    url.pathname = "/login";
    url.search = "?error=domain";
    return NextResponse.redirect(url);
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email;

  // First sign-in creates the row; subsequent calls just refresh last_active_at.
  // No insert race: id is the PK and equals auth.uid().
  const { error: upsertError } = await supabase
    .from("member")
    .upsert(
      {
        id: user.id,
        email: user.email,
        name,
        status: "active",
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (upsertError) {
    console.error("member upsert failed", upsertError);
    // Continue — RLS will surface the issue on the next page.
  }

  url.pathname = next.startsWith("/") ? next : "/overview";
  url.search = "";
  return NextResponse.redirect(url);
}
```

**Caveat:** the upsert path runs under the user's RLS context. The `member_write_admin` INSERT policy blocks normal users, so first-sign-in inserts will fail. Fix options:
- (a) Add `member_self_insert` policy: `for insert with check (id = auth.uid())`.
- (b) Use a service-role client here.

Choice for this plan: **(a) — add a policy** that lets a user create their own row, but only if `id = auth.uid()`. Default role is `'viewer'`, which is correct for an unprivileged sign-in. Admins can later promote them.

Add to `supabase/schemas/06_rls.sql`:

```sql
create policy member_self_insert on member for insert
  with check (id = auth.uid());
```

Then regenerate the migration:

```bash
supabase db diff --schema public -f member_self_insert
supabase db reset
cd client && pnpm db:gen-types
```

- [ ] **Step 2: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint && pnpm dev
```

Smoke: sign out + sign back in with a `@gmail.com` Google account; verify a member row appears in DB (use Supabase Studio).

- [ ] **Step 3: Commit**

```bash
git add client/src/app/auth/callback/route.ts supabase/schemas/06_rls.sql supabase/migrations/*_member_self_insert.sql client/src/types/database.types.ts
git commit -m "feat(auth): bootstrap member on first sign-in; gate @gmail.com domain"
```

---

## Phase 6: Overview screen

### Task 6.1: Overview data + page shell (KPIs + lifecycle bar)

**Files:**
- Create: `client/src/app/(app)/overview/page.tsx`
- Create: `client/src/app/(app)/overview/loading.tsx`
- Create: `client/src/app/(app)/overview/error.tsx`
- Create: `client/src/app/(app)/overview/_components/kpi-card.tsx`
- Create: `client/src/app/(app)/overview/_components/lifecycle-bar.tsx`
- Modify: `client/src/messages/en.json`, `client/src/messages/vi.json`

- [ ] **Step 1: Aggregation logic in the page**

`page.tsx` reads `listDevices()` + `getOrgSettings()` + `listRecentActivity(5)` in parallel, then aggregates server-side. Use the screenshot `screenshots/18-overview-light.png` and `Overview.html` as the visual target.

The page calls `getCurrentMember()` — if no member, render `<PermissionDenied />`. Otherwise compute:

- `totalDevices`: count + sum of quantity + distinct departments
- `inUse`: count where status='in-use'; subtitle = storage + retired counts
- `needsAttention`: count where `flag_warranty_expiring || flag_inventory_overdue` (use the `flag_*` columns from `devices_with_flags`)
- `inRepair`: count where status='in-repair'; subtitle = fleet-wide average condition
- Status share: 4 buckets, share of total
- Group share: each group's share of the whole fleet
- Attention list: devices with ≥1 flag

Render KPI row (4 cards), lifecycle stacked bar, inventory-by-group bars, attention rail, recent activity timeline. All links go to `/devices?<filter>`.

**File: `page.tsx`** (skeleton):

```tsx
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/data/auth";
import { listDevices } from "@/lib/data/devices";
import { listRecentActivity } from "@/lib/data/activity";
import { PermissionDenied } from "@/components/app/states/permission-denied";
import { KpiCard } from "./_components/kpi-card";
import { LifecycleBar } from "./_components/lifecycle-bar";
// ... import GroupShareBars, AttentionRail, RecentActivityList (added in next tasks) ...

export default async function OverviewPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const [devices, activity] = await Promise.all([
    listDevices(),
    listRecentActivity(5),
  ]);

  // Aggregate
  const total = devices.length;
  const inUse = devices.filter(d => d.status === "in-use").length;
  const inStorage = devices.filter(d => d.status === "in-storage").length;
  const inRepair = devices.filter(d => d.status === "in-repair").length;
  const retired = devices.filter(d => d.status === "retired").length;
  const needsAttention = devices.filter(d => d.flagWarrantyExpiring || d.flagInventoryOverdue).length;
  const totalQuantity = devices.reduce((s, d) => s + d.quantity, 0);
  const distinctDepts = new Set(devices.map(d => d.departmentId)).size;
  const avgCondition = total ? Math.round(devices.reduce((s, d) => s + d.condition, 0) / total) : 0;

  // ... pass into components, return JSX ...
}
```

**File: `kpi-card.tsx`:**

```tsx
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: "default" | "alert";
}

export function KpiCard({ icon: Icon, label, value, subtitle, tone = "default" }: KpiCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon
          className={cn("size-4", tone === "alert" ? "text-amber-500" : "text-muted-foreground")}
          aria-hidden
        />
      </div>
      <div className="text-[30px] font-semibold leading-none tabular-nums">{value}</div>
      {subtitle ? <div className="mt-2 text-xs text-muted-foreground">{subtitle}</div> : null}
    </Card>
  );
}
```

**File: `lifecycle-bar.tsx`:**

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";

export interface LifecycleSegment {
  key: "in-use" | "in-storage" | "in-repair" | "retired";
  label: string;
  count: number;
  colorVar: string;        // CSS var or class for fill color
}

export function LifecycleBar({ segments, total, title }: { segments: LifecycleSegment[]; total: number; title: string }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {segments.map(s => (
          <div
            key={s.key}
            className="h-full"
            style={{ width: total ? `${(s.count / total) * 100}%` : 0, backgroundColor: `var(${s.colorVar})` }}
            aria-label={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {segments.map(s => (
          <li key={s.key}>
            <Link
              href={`/devices?status=${s.key}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: `var(${s.colorVar})` }} aria-hidden />
              <span className="flex-1">{s.label}</span>
              <span className="text-muted-foreground tabular-nums">{s.count}</span>
              <span className="text-muted-foreground w-12 text-right tabular-nums">
                {total ? `${Math.round((s.count / total) * 100)}%` : "0%"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
```

- [ ] **Step 2: i18n keys**

Add to `en.json` (and mirror placeholders into `vi.json`):

```json
"overview": {
  "title": "Overview",
  "kpiTotalDevices": "Total devices",
  "kpiInUse": "In use",
  "kpiNeedsAttention": "Needs attention",
  "kpiInRepair": "In repair",
  "kpiTotalSubtitle": "{quantity} units · {departments} departments",
  "kpiInUseSubtitle": "{storage} in storage · {retired} retired",
  "kpiInRepairSubtitle": "Avg. condition {avg}%",
  "lifecycleTitle": "Lifecycle status",
  "groupShareTitle": "Inventory by group",
  "groupShareSubtitle": "Share of all {total} devices",
  "attentionTitle": "Needs attention",
  "attentionEmpty": "No devices need attention right now.",
  "activityTitle": "Recent activity"
}
```

- [ ] **Step 3: loading + error**

Create `loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-72" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
```

Create `error.tsx`:

```tsx
"use client";
import { ErrorState } from "@/components/app/states/error-state";
import { useTranslations } from "next-intl";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("states");
  return (
    <ErrorState
      title={t("errorTitle")}
      description={t("errorDescription")}
      onRetry={reset}
      requestId={error.message.slice(0, 64)}
    />
  );
}
```

(Add `states.errorTitle` / `states.errorDescription` to en/vi.)

- [ ] **Step 4: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint && pnpm dev
```

Navigate to `/overview` — KPIs render, lifecycle bar renders with seeded data.

- [ ] **Step 5: Commit**

```bash
git add "client/src/app/(app)/overview/" client/src/messages/
git commit -m "feat(overview): KPI row, lifecycle bar, loading/error states"
```

### Task 6.2: Inventory-by-group bars, attention rail, recent activity

**Files:**
- Create: `client/src/app/(app)/overview/_components/group-share-bars.tsx`
- Create: `client/src/app/(app)/overview/_components/attention-rail.tsx`
- Create: `client/src/app/(app)/overview/_components/recent-activity.tsx`
- Modify: `client/src/app/(app)/overview/page.tsx`

- [ ] **Step 1: Group share bars**

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";

export interface GroupShareRow {
  groupId: string;
  groupName: string;
  icon: string | null;        // lucide icon name from device_group.icon
  count: number;
}

export function GroupShareBars({ rows, total, title, subtitle }: {
  rows: GroupShareRow[]; total: number; title: string; subtitle: string;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ul className="space-y-2.5">
        {rows.map(r => {
          const pct = total ? (r.count / total) * 100 : 0;
          return (
            <li key={r.groupId}>
              <Link
                href={`/devices?group=${r.groupId}`}
                className="grid grid-cols-[116px_1fr_auto] items-center gap-3 px-2 py-1.5 rounded hover:bg-muted text-sm"
              >
                <span className="truncate">{r.groupName}</span>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} aria-hidden />
                </div>
                <span className="tabular-nums text-muted-foreground">
                  {r.count} · {Math.round(pct)}%
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
```

- [ ] **Step 2: Attention rail**

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { DeviceWithFlags } from "@/lib/domain/devices";

export function AttentionRail({ devices, title, emptyText }: {
  devices: DeviceWithFlags[]; title: string; emptyText: string;
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {devices.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {devices.map(d => (
            <li key={d.id}>
              <Link
                href={`/devices/${d.code}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm"
              >
                <span className="flex-1 truncate">{d.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{d.code}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
```

- [ ] **Step 3: Recent activity**

```tsx
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { Activity } from "@/lib/domain/activity";
import { ACTIVITY_META } from "@/lib/domain/activity";

export function RecentActivityList({ items, title }: { items: Activity[]; title: string }) {
  const t = useTranslations("activity");
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map(a => {
          const meta = ACTIVITY_META[a.action];
          return (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="size-6 mt-0.5 rounded-full bg-muted flex-shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <div>
                  <span className="font-medium">{a.actorName ?? "System"}</span>{" "}
                  <span className="text-muted-foreground">{t(meta.verbKey)}</span>{" "}
                  <span className="font-medium">{a.entityLabel ?? ""}</span>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
```

- [ ] **Step 4: Wire into page.tsx**

Compute `groupShare` (groupId, name, count) by reducing devices; build attention list; pass into the new components.

- [ ] **Step 5: i18n — activity verbs**

Add to `en.json` (and `vi.json`):

```json
"activity": {
  "deviceCreated": "created device",
  "deviceUpdated": "updated device",
  "deviceStatusChanged": "changed status of",
  "deviceDeleted": "deleted device",
  "deviceRestored": "restored device",
  "deviceInventoryChecked": "checked inventory of",
  "deviceAllocated": "allocated device",
  "memberInvited": "invited",
  "memberRoleChanged": "changed role of",
  "memberRemoved": "removed",
  "catalogCreated": "added to catalog",
  "catalogUpdated": "updated in catalog",
  "catalogDeleted": "removed from catalog",
  "settingsUpdated": "updated workspace settings"
}
```

- [ ] **Step 6: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint && pnpm dev
```

`/overview` shows all four sections.

- [ ] **Step 7: Verify UI fidelity via subagent**

Dispatch a subagent (`Agent` tool, subagent_type: general-purpose) with:

> The **definitive fidelity target is `design_handoff_devicehub/Overview.html`** — match it exactly. Screenshots `18-overview-light.png` / `19-overview-dark.png` are reference only.
> Run `pnpm dev` in `client/`, fetch `http://localhost:3000/overview`, and compare against the HTML mock. Walk every section (KPI row, lifecycle stacked bar + legend, group share bars, attention rail, recent activity timeline) and report mismatches in layout, components used, copy/labels, CSS classes/spacing/colors, and behavior (links, hovers). Inspect the HTML's DOM structure and styles directly — do not rely on the screenshot for any judgment. Do NOT fix; just report a structured diff.

Use the subagent's findings to make targeted adjustments to match the HTML (one or more commits).

- [ ] **Step 8: Commit**

```bash
git add "client/src/app/(app)/overview/" client/src/messages/
git commit -m "feat(overview): group share bars, attention rail, recent activity"
```

---

## Phase 7: Members screen

### Task 7.1: Members page — list, search, role filter, role summary cards

**Files:**
- Create: `client/src/app/(app)/members/page.tsx`
- Create: `client/src/app/(app)/members/loading.tsx`
- Create: `client/src/app/(app)/members/error.tsx`
- Create: `client/src/app/(app)/members/_components/role-summary-row.tsx`
- Create: `client/src/app/(app)/members/_components/role-filter.tsx`
- Create: `client/src/app/(app)/members/_components/members-table.tsx`
- Modify: `client/src/messages/en.json` (+ vi)

- [ ] **Step 1: Page**

```tsx
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/data/auth";
import { listMembers } from "@/lib/data/members";
import type { MemberRole } from "@/lib/domain/members";
import { RoleSummaryRow } from "./_components/role-summary-row";
import { RoleFilter } from "./_components/role-filter";
import { MembersTable } from "./_components/members-table";

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const sp = await searchParams;
  const role = (sp.role as MemberRole | "all") ?? "all";
  const members = await listMembers({ q: sp.q, role });

  const counts = {
    it_admin: members.filter(m => m.role === "it_admin").length,
    manager: members.filter(m => m.role === "manager").length,
    viewer: members.filter(m => m.role === "viewer").length,
  };

  return (
    <div className="space-y-6">
      <RoleSummaryRow counts={counts} />
      <RoleFilter active={role} />
      <MembersTable members={members} currentMemberId={member.id} />
    </div>
  );
}
```

- [ ] **Step 2: RoleSummaryRow** — three cards (icon + role name + count + one-line capability summary). Use `ShieldCheck`/`UserCog`/`Eye` icons.

- [ ] **Step 3: RoleFilter** — segmented `ToggleGroup` (already in shadcn ui) bound to a URL param via client component; updates `?role=`.

- [ ] **Step 4: MembersTable** — `Table` with columns per the handoff: checkbox, Member (avatar+name+email + "You" pill on `member.id === currentMemberId`), Role badge, Department, Devices managed (count, "—" for viewers — derived count requires a separate query; for v1 omit and add in 7.2 once the bulk bar is wired), Last active, Status badge, row actions.

(Defer the per-row "devices managed" count to keep this task focused. Add it in a follow-up step or accept that the column shows "—" initially.)

- [ ] **Step 5: i18n**

```json
"members": {
  "title": "Members",
  "search": "Search members",
  "invite": "Invite member",
  "export": "Export",
  "summaryAdmins": "IT Admins",
  "summaryManagers": "Managers",
  "summaryViewers": "Viewers",
  "capAdmin": "Full access to inventory, members, and settings",
  "capManager": "Manages devices in their department",
  "capViewer": "Read-only access to inventory",
  "filterAll": "All",
  "filterAdmins": "Admins",
  "filterManagers": "Managers",
  "filterViewers": "Viewers",
  "colMember": "Member",
  "colRole": "Role",
  "colDepartment": "Department",
  "colDevicesManaged": "Devices managed",
  "colLastActive": "Last active",
  "colStatus": "Status",
  "youPill": "You",
  "statusActive": "Active",
  "statusInvited": "Invited",
  "statusDisabled": "Disabled",
  "roleItAdmin": "IT Admin",
  "roleManager": "Manager",
  "roleViewer": "Viewer",
  "metaCount": "{count} members"
}
```

- [ ] **Step 6: loading + error** — mirror Overview's pattern (skeleton for 3 cards + 1 segmented + table rows; reuse `<ErrorState>`).

- [ ] **Step 7: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint && pnpm dev
```

`/members` renders against seeded members.

- [ ] **Step 8: Commit**

```bash
git add "client/src/app/(app)/members/" client/src/messages/
git commit -m "feat(members): list, search, role filter, role summary cards"
```

### Task 7.2: Invite dialog + invite Server Action

**Files:**
- Create: `client/src/app/(app)/members/_actions.ts`
- Create: `client/src/app/(app)/members/_components/invite-dialog.tsx`
- Modify: `client/src/app/(app)/members/page.tsx` (mount the dialog trigger in the topbar)

- [ ] **Step 1: Server action**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/auth";
import { logActivity } from "@/lib/data/activity";
import { can } from "@/lib/domain/members";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/domain/members";

export async function inviteMemberAction(input: InviteMemberInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "manageMembers")) return { ok: false, error: "not-allowed" };

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };

  const supabase = await createClient();
  // For now: insert a member row only (no auth invite email).
  // member.id is not auth.uid() here — insert with a generated uuid;
  // on first sign-in the auth callback will set status='active'.
  // But member.id is PK uuid; using gen_random_uuid() requires DB-side default.
  // The schema declares `id uuid PRIMARY KEY` with no default — supply one here.
  const id = crypto.randomUUID();
  const { error } = await supabase.from("member").insert({
    id,
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    status: "invited",
    department_id: parsed.data.departmentId,
    invited_by: me.id,
  });
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actorId: me.id,
    action: "member.invited",
    entityType: "member",
    entityId: id,
    entityLabel: parsed.data.email,
  });

  revalidatePath("/members");
  return { ok: true };
}

export async function updateMemberRoleAction(memberId: string, role: "it_admin" | "manager" | "viewer") {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "manageMembers")) return { ok: false as const, error: "not-allowed" };
  const supabase = await createClient();
  const { error } = await supabase.from("member").update({ role }).eq("id", memberId);
  if (error) return { ok: false as const, error: error.message };
  await logActivity({
    actorId: me.id, action: "member.role_changed", entityType: "member",
    entityId: memberId, metadata: { to: role },
  });
  revalidatePath("/members");
  return { ok: true as const };
}

export async function removeMemberAction(memberId: string) {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "manageMembers")) return { ok: false as const, error: "not-allowed" };
  const supabase = await createClient();
  const { data: row } = await supabase.from("member").select("email").eq("id", memberId).single();
  const { error } = await supabase.from("member").delete().eq("id", memberId);
  if (error) return { ok: false as const, error: error.message };
  await logActivity({
    actorId: me.id, action: "member.removed", entityType: "member",
    entityId: memberId, entityLabel: row?.email ?? null,
  });
  revalidatePath("/members");
  return { ok: true as const };
}
```

**Caveat:** the schema declares `member.id uuid PRIMARY KEY` with no default. The auth-callback path supplies it from `auth.uid()`; the invite path supplies a fresh `crypto.randomUUID()`. When the invited user later signs in, the auth callback's upsert by `id` won't match — it'd insert a duplicate by `id` but the `email UNIQUE` constraint would fail.

**Fix:** change the auth-callback upsert to match by email first (find the existing invited row), then update its `id` to `auth.uid()` and `status` to 'active'. Add this in the same task to keep the flow correct.

Update `client/src/app/auth/callback/route.ts`'s upsert section to:

```typescript
// If an invited row exists with this email, claim it (update id to auth.uid()).
const { data: existing } = await supabase.from("member").select("id").eq("email", user.email).maybeSingle();
if (existing && existing.id !== user.id) {
  // Move the row's id to the new auth uid. Need to update FKs that reference it (invited_by, reports_to) — but they're set null on delete, and on update is by default not cascaded. Simplest: delete the invited row, insert with auth.uid().
  await supabase.from("member").delete().eq("id", existing.id);
}
await supabase.from("member").upsert({
  id: user.id,
  email: user.email,
  name,
  status: "active",
  last_active_at: new Date().toISOString(),
}, { onConflict: "id" });
```

- [ ] **Step 2: Invite dialog (client component)**

`InviteDialog` uses shadcn `Dialog` + form with `name`/`email`/`role`/`departmentId` fields. On submit: call `inviteMemberAction`; on success `toast.success(t("invitationSent"))`; on error `toast.error(...)`. Departments are passed in as a prop (RSC parent fetches via `listDepartments()` — already exists in `lib/data/departments.ts`).

- [ ] **Step 3: i18n additions** for invite dialog labels, toast messages.

- [ ] **Step 4: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint && pnpm dev
```

Smoke: open invite dialog, submit with valid input → new "Invited" row in table.

- [ ] **Step 5: Commit**

```bash
git add "client/src/app/(app)/members/" client/src/app/auth/callback/route.ts client/src/messages/
git commit -m "feat(members): invite/role/remove server actions + invite dialog"
```

### Task 7.3: Bulk selection bar (role change, remove)

**Files:**
- Create: `client/src/app/(app)/members/_components/bulk-actions.tsx`
- Modify: `client/src/app/(app)/members/_components/members-table.tsx`

- [ ] **Step 1: Selection state** — `MembersTable` is a client component holding `Set<string>` of selected member ids; header checkbox is tri-state.

- [ ] **Step 2: BulkActions** — uses `<BulkActionBar>`; buttons: Role (popover with 3 role options → calls `updateMemberRoleAction` for each selected), Export (stub toast for now), Remove (`useConfirm` → `removeMemberAction` for each selected).

- [ ] **Step 3: Verify + subagent fidelity check**

Run `pnpm dev`. Dispatch a subagent (general-purpose):

> **Definitive fidelity target: `design_handoff_devicehub/Members.html`** — match it exactly. Screenshots 20–21 are reference only.
> Fetch `http://localhost:3000/members`, compare to the HTML mock. Inspect the mock's DOM and CSS directly. Walk every region (role-summary cards, segmented role filter, search/topbar actions, table columns + row markup, bulk-action bar markup) and report any mismatches in structure, copy, classes, spacing, behavior, or bulk-bar contents. Do NOT fix; report a structured diff.

Use the subagent's report to drive targeted fixes.

- [ ] **Step 4: Commit**

```bash
git add "client/src/app/(app)/members/"
git commit -m "feat(members): bulk selection bar (role, export, remove)"
```

---

## Phase 8: Member profile

### Task 8.1: Profile page — details, devices managed, permissions, activity

**Files:**
- Create: `client/src/app/(app)/members/[id]/page.tsx`
- Create: `client/src/app/(app)/members/[id]/loading.tsx`
- Create: `client/src/app/(app)/members/[id]/error.tsx`
- Create: `client/src/app/(app)/members/[id]/_components/profile-header.tsx`
- Create: `client/src/app/(app)/members/[id]/_components/details-card.tsx`
- Create: `client/src/app/(app)/members/[id]/_components/devices-managed.tsx`
- Create: `client/src/app/(app)/members/[id]/_components/permissions-card.tsx`

- [ ] **Step 1: Page**

```tsx
import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/data/auth";
import { getMemberById } from "@/lib/data/members";
import { listDevices } from "@/lib/data/devices";
import { listActivityByActor } from "@/lib/data/activity";
import { ProfileHeader } from "./_components/profile-header";
import { DetailsCard } from "./_components/details-card";
import { DevicesManaged } from "./_components/devices-managed";
import { PermissionsCard } from "./_components/permissions-card";
import { RecentActivityList } from "../../overview/_components/recent-activity";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentMember();
  if (!me) redirect("/login");

  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) notFound();

  const [managedDevices, activity] = await Promise.all([
    member.departmentId
      ? listDevices({ dept: member.departmentId }).then(ds => ds.slice(0, 6))
      : Promise.resolve([]),
    listActivityByActor(member.id, 10),
  ]);

  return (
    <div className="space-y-6">
      <ProfileHeader member={member} isYou={me.id === member.id} />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <DetailsCard member={member} />
          {member.role !== "viewer" ? <DevicesManaged devices={managedDevices} departmentId={member.departmentId} /> : null}
          <PermissionsCard role={member.role} />
        </div>
        <div className="space-y-6">
          <RecentActivityList items={activity} title="Activity" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Permissions card**

Renders the `CAPABILITIES[role]` matrix as rows of `green-check (allowed)` / `muted-dash (denied)` with the capability label. Capability labels come from i18n.

- [ ] **Step 3: i18n keys** for capability labels, "Devices managed", "View all in {dept}", "Member since", "Last active", etc.

- [ ] **Step 4: Verify + subagent fidelity check**

Dispatch a subagent (general-purpose):

> **Definitive fidelity target: `design_handoff_devicehub/Member Profile.html`** — match it exactly. Screenshots 22–23 are reference only.
> Pick a seeded member id and fetch `http://localhost:3000/members/<id>`. Compare to the HTML mock by reading the mock's DOM and CSS directly. Walk every region (header with avatar/role/status, details definition list, devices-managed card, permissions matrix card, right-rail stat list, recent-activity timeline) and report structural/copy/spacing/class mismatches. Do NOT fix; report a structured diff.

- [ ] **Step 5: Commit**

```bash
git add "client/src/app/(app)/members/[id]/" client/src/messages/
git commit -m "feat(members): member profile page (details, managed, permissions, activity)"
```

---

## Phase 9: Settings

### Task 9.1: Settings page shell + admin gate + section nav

**Files:**
- Create: `client/src/app/(app)/settings/page.tsx`
- Create: `client/src/app/(app)/settings/loading.tsx`
- Create: `client/src/app/(app)/settings/error.tsx`
- Create: `client/src/app/(app)/settings/_components/section-nav.tsx`
- Create: `client/src/app/(app)/settings/_components/settings-form.tsx`

- [ ] **Step 1: Page**

```tsx
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/data/auth";
import { getOrgSettings, getUserPreference } from "@/lib/data/settings";
import { can } from "@/lib/domain/members";
import { PermissionDenied } from "@/components/app/states/permission-denied";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const me = await getCurrentMember();
  if (!me) redirect("/login");

  if (!can(me.role, "changeSettings")) {
    return (
      <PermissionDenied
        title="Settings are admin-only"
        description="Workspace settings can only be changed by an IT Admin. Ask one of your admins to update settings on your behalf."
      />
    );
  }

  const [settings, prefs] = await Promise.all([
    getOrgSettings(),
    getUserPreference(me.id),
  ]);

  return <SettingsForm initialSettings={settings} initialPrefs={prefs} memberId={me.id} />;
}
```

- [ ] **Step 2: SettingsForm (client)**

A single client component with state for all editable fields. Renders 6 sections per the handoff: General, Appearance, Inventory defaults, Notifications, Data & export, Condition thresholds, Danger zone. Each section is a `<Card>` with an `id="general"` etc. so the section nav can scroll to it. Bottom Save bar shows dirty state and calls `updateOrgSettingsAction` / `upsertUserPreferenceAction`.

- [ ] **Step 3: SectionNav**

Sticky left nav with anchor links and scrollspy (using `IntersectionObserver` in a `useEffect`).

- [ ] **Step 4: i18n keys** — every label, helper text, danger-zone copy.

- [ ] **Step 5: Verify** — visit `/settings` as an admin, see all sections; as a viewer (manually change `member.role` in DB), see permission-denied.

- [ ] **Step 6: Commit**

```bash
git add "client/src/app/(app)/settings/" client/src/messages/
git commit -m "feat(settings): shell, admin gate, section nav, form scaffold"
```

### Task 9.2: Settings save + purge actions

**Files:**
- Create: `client/src/app/(app)/settings/_actions.ts`
- Modify: `client/src/lib/data/settings.ts` (add write helpers)

- [ ] **Step 1: Data writes**

Add to `client/src/lib/data/settings.ts`:

```typescript
import type { OrgSettingsInput, UserPreferenceInput } from "@/lib/domain/settings";

export async function updateOrgSettings(patch: OrgSettingsInput, updatedBy: string): Promise<void> {
  const supabase = await createClient();
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

export async function upsertUserPreference(userId: string, patch: UserPreferenceInput): Promise<void> {
  const supabase = await createClient();
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

export async function purgeRetiredDevices(): Promise<number> {
  const supabase = await createClient();
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

- [ ] **Step 2: Server actions**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/data/auth";
import { logActivity } from "@/lib/data/activity";
import { can } from "@/lib/domain/members";
import { orgSettingsSchema, userPreferenceSchema, type OrgSettingsInput, type UserPreferenceInput } from "@/lib/domain/settings";
import { updateOrgSettings, upsertUserPreference, purgeRetiredDevices } from "@/lib/data/settings";

export async function saveOrgSettingsAction(input: OrgSettingsInput) {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "changeSettings")) return { ok: false as const, error: "not-allowed" };
  const parsed = orgSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "invalid" };
  await updateOrgSettings(parsed.data, me.id);
  await logActivity({
    actorId: me.id, action: "settings.updated", entityType: "settings", entityId: null,
  });
  revalidatePath("/settings");
  revalidatePath("/overview");
  revalidatePath("/devices");
  return { ok: true as const };
}

export async function saveUserPreferenceAction(input: UserPreferenceInput) {
  const me = await getCurrentMember();
  if (!me) return { ok: false as const, error: "not-allowed" };
  const parsed = userPreferenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "invalid" };
  await upsertUserPreference(me.id, parsed.data);
  return { ok: true as const };
}

export async function purgeRetiredAction() {
  const me = await getCurrentMember();
  if (!me || !can(me.role, "changeSettings")) return { ok: false as const, error: "not-allowed" };
  const count = await purgeRetiredDevices();
  await logActivity({
    actorId: me.id, action: "settings.updated", entityType: "settings", entityId: null,
    metadata: { purged: count },
  });
  revalidatePath("/devices");
  return { ok: true as const, count };
}
```

- [ ] **Step 3: Wire from form** — SettingsForm submit → `saveOrgSettingsAction`; theme/view change → `saveUserPreferenceAction`; Purge button → `useConfirm` → `purgeRetiredAction` → toast.

- [ ] **Step 4: Verify + subagent fidelity check**

Dispatch a subagent (general-purpose):

> **Definitive fidelity target: `design_handoff_devicehub/Settings.html`** — match it exactly. Screenshots 24–25 are reference only.
> Sign in as an IT Admin, fetch `http://localhost:3000/settings`. Compare to the HTML mock by reading the mock's DOM and CSS directly. Walk every section (General, Appearance, Inventory defaults, Notifications, Data & export, Condition thresholds, Danger zone) plus the sticky section nav and save bar — report mismatches in section ordering, field labels, helper text, control types, layout, and the danger-zone copy. Do NOT fix; report a structured diff.

- [ ] **Step 5: Commit**

```bash
git add "client/src/app/(app)/settings/" client/src/lib/data/settings.ts client/src/messages/
git commit -m "feat(settings): save actions + purge retired"
```

---

## Phase 10: 404 / 500

### Task 10.1: Branded 404 and root error page

**Files:**
- Create: `client/src/app/not-found.tsx`
- Create: `client/src/app/error.tsx` (top-level error boundary)
- Modify: `client/src/messages/en.json`, `vi.json` (states namespace)

- [ ] **Step 1: not-found.tsx**

Render a centered full-viewport branded page with the DeviceHub mark, a big "404", title/description, and a button back to `/overview`. Use `BrandMark` from `components/app/`.

- [ ] **Step 2: error.tsx**

Mirror with the 500 layout — big "500", description, Reload button (`router.refresh()`), mono error message slice.

- [ ] **Step 3: Verify** — visit `/foo` → 404; throw an error in a route temporarily → 500.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/not-found.tsx client/src/app/error.tsx client/src/messages/
git commit -m "feat(app): branded 404 and 500 pages"
```

---

## Phase 11: Activity logging retrofit

### Task 11.1: Wire `logActivity()` into existing device actions

**Files:**
- Modify: `client/src/app/(app)/devices/_actions.ts`

- [ ] **Step 1: Read the existing actions file**

Identify each mutating action (create, update, delete, status change). For each, after the DB mutation succeeds and before returning, call:

```typescript
await logActivity({
  actorId: me.id,
  action: "device.created", // or .updated / .deleted / .status_changed
  entityType: "device",
  entityId: device.id,
  entityLabel: device.name,
  metadata: { /* e.g. for status: { from, to } */ },
});
```

`me` from `getCurrentMember()` (add if missing).

For `status_changed`, only log when the status actually differs from the previous value.

- [ ] **Step 2: Verify**

Create/edit/delete a device → confirm rows appear in `activity`. Overview "Recent activity" populates.

- [ ] **Step 3: Commit**

```bash
git add "client/src/app/(app)/devices/_actions.ts"
git commit -m "feat(activity): log device create/update/delete/status-change"
```

### Task 11.2: Wire `logActivity()` into catalog actions

**Files:**
- Modify: `client/src/app/(app)/departments/_actions.ts`
- Modify: `client/src/app/(app)/groups/_actions.ts`
- Modify: `client/src/app/(app)/manufacturers/_actions.ts`

(Verify exact file paths first — actions may live in different files per catalog.)

- [ ] **Step 1: Add `logActivity()` calls**

After each catalog create/update/delete:

```typescript
await logActivity({
  actorId: me.id,
  action: "catalog.created", // or .updated / .deleted
  entityType: "department", // or "device_group" / "manufacturer"
  entityId: row.id,
  entityLabel: row.name,
});
```

- [ ] **Step 2: Verify**

```bash
cd client && pnpm tsc --noEmit && pnpm lint && pnpm dev
```

Add a department, group, manufacturer; confirm rows appear in `activity`.

- [ ] **Step 3: Commit**

```bash
git add "client/src/app/(app)/departments/_actions.ts" "client/src/app/(app)/groups/_actions.ts" "client/src/app/(app)/manufacturers/_actions.ts"
git commit -m "feat(activity): log catalog create/update/delete"
```

---

## Phase 12: Re-verify already-implemented pages against updated HTML

The handoff revision modified existing mock HTML — `Login.html`, `Device List.html`, and the supporting `theme/shell.{css,js}` + `types.ts`. The other existing screens (`Device Details.html`, `Create Device.html`, `Edit Device.html`, `Departments.html`, `Groups.html`, `Manufacturers.html`) were not flagged as modified in this revision, but a sweep is still cheap and catches anything implicit (e.g. new theme classes referenced from `shell.css`).

For each existing page, dispatch a subagent fidelity check against the HTML mock; address findings in targeted commits. **The HTML file is the definitive target; screenshots are reference only.**

### Task 12.1: Re-verify Login

**Files:**
- Modify: `client/src/app/login/page.tsx` (or wherever Login is implemented — check first)

- [ ] **Step 1: Subagent fidelity check**

Dispatch a subagent (general-purpose):

> **Definitive fidelity target: `design_handoff_devicehub/Login.html`** (this file was updated in the recent handoff revision; verify against its current contents, not a prior cached read). Screenshots are reference only.
> Run `pnpm dev` in `client/`. Fetch `http://localhost:3000/login`. Read the mock's HTML and CSS directly. Compare layout (2-column grid, art panel, brand mark, Google button, managed-access note, legal line, art panel stats) and report any mismatch in DOM structure, copy, classes, gradient values, or interactive states. Do NOT fix; report a structured diff.

- [ ] **Step 2: Apply targeted fixes**

Use the report to make minimal edits matching the HTML.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/login/
git commit -m "fix(ui): match login to updated mock"
```

### Task 12.2: Re-verify Device List

**Files:**
- Modify: `client/src/app/(app)/devices/page.tsx` and any device-list component files

- [ ] **Step 1: Subagent fidelity check**

Dispatch a subagent (general-purpose):

> **Definitive fidelity target: `design_handoff_devicehub/Device List.html`** (updated in this revision). Screenshots `02`/`03`/`04`/`17`/`47`/`48`/`50` are reference only.
> Fetch `http://localhost:3000/devices`. Read the mock's HTML and CSS directly. Walk: toolbar (filters + Columns + view toggle), table columns + row markup, cards-view markup (banner + name + meta grid + flag chips + condition bar), Columns dropdown, bulk action bar (rows selected → Status/Export/Delete), filter chips/clear behavior, derived flag chips, condition-bar color thresholds, URL-param hydration. Report all structural, class, copy, and behavior mismatches. Do NOT fix; report a structured diff.

- [ ] **Step 2: Apply targeted fixes**

This page was just touched in Phase 2 (RPC swap), so confirm flag display still works after fixes. If the handoff revision added bulk-action wiring to the Device list mock, this is where it gets implemented (using the shared `<BulkActionBar>` from Task 4.5 + `useConfirm` for delete).

- [ ] **Step 3: Commit**

```bash
git add "client/src/app/(app)/devices/"
git commit -m "fix(ui): match device list to updated mock (bulk actions, filters, flags)"
```

### Task 12.3: Cheap sweep over the other existing pages

For each of: Device Details, Create Device, Edit Device, Departments, Groups, Manufacturers — dispatch a fidelity subagent. Skip the fix step if the report is empty.

- [ ] **Step 1: Spawn six fidelity subagents in parallel** (one Agent tool call per page, all in a single message):

For each page, use this prompt template (substitute filename):

> **Definitive fidelity target: `design_handoff_devicehub/<FILENAME>`** (verify against current contents — the handoff revision may have touched shared theme files even if this screen's HTML wasn't directly modified). Screenshots are reference only.
> Run `pnpm dev` in `client/`. Fetch the corresponding URL (`http://localhost:3000/<route>`). Read the mock's HTML and CSS directly. Report any mismatch — structure, classes, copy, behavior. Do NOT fix; report a structured diff. If everything matches, say so.

Pages and routes:
- `Device Details.html` → `/devices/<code>` (pick a seeded code)
- `Create Device.html` → `/devices/new`
- `Edit Device.html` → `/devices/<code>/edit`
- `Departments.html` → `/departments`
- `Groups.html` → `/groups`
- `Manufacturers.html` → `/manufacturers`

- [ ] **Step 2: Address findings (per page)**

For any page with a non-empty report, make targeted edits and commit. Commit message pattern:

```bash
git commit -m "fix(ui): match <page> to updated mock"
```

If reports are empty, no commit needed for that page.

### Task 12.4: Re-verify common shell + states

**Files:**
- Reference: `design_handoff_devicehub/theme/shell.css`, `design_handoff_devicehub/theme/shell.js`, `design_handoff_devicehub/states/*.html`

- [ ] **Step 1: Subagent fidelity check on the shell**

Dispatch a subagent (general-purpose):

> **Definitive fidelity targets:** sidebar/topbar/avatar-menu behavior described in `design_handoff_devicehub/theme/shell.css` and `design_handoff_devicehub/theme/shell.js`; the state references in `design_handoff_devicehub/states/*.html`. Screenshots `01`, `46`, and the per-state screenshots are reference only.
> Compare the implemented sidebar, topbar, avatar menu, toast, confirm dialog, skeleton/error/empty/permission-denied state components, and 404/500 pages to those reference files. Read the CSS and JS directly to understand intended behavior (close-on-Esc, focus trap, tri-state checkbox, etc.). Report any behavioral or visual mismatch. Do NOT fix; report a structured diff.

- [ ] **Step 2: Apply targeted fixes and commit**

```bash
git commit -m "fix(shell): match shell/states to updated handoff references"
```

---

## Phase 13: Final verification

### Task 13.1: Full smoke pass

- [ ] **Step 1: Reset and re-seed**

```bash
supabase db reset
cd client && pnpm db:gen-types && pnpm tsc --noEmit && pnpm lint && pnpm build
```

Expected: clean build.

- [ ] **Step 2: Acceptance checklist**

Walk every checkbox in the handoff README's "Acceptance checklist" section for: Global/shell, Overview, Members/Member profile, Settings, Auth/errors. Note any failing boxes; open a follow-up task for each.

- [ ] **Step 3: Final subagent UI sweep**

Dispatch one subagent per new screen (Overview, Members, Member profile, Settings) in parallel (all four Agent tool calls in a single message). For each:

> **Definitive fidelity target: `design_handoff_devicehub/<page>.html`.** Screenshots are reference only. Read the mock's DOM and CSS directly and report every structural, copy, class, spacing, or behavior mismatch with the rendered page. This is the final sweep — be thorough.

Address any mismatches in one consolidated commit per screen.

- [ ] **Step 4: Done**

```bash
git log --oneline | head -30   # sanity check
git status                      # should be clean
```

---

## Spec coverage check

Cross-referencing the spec to ensure every requirement has a task:

- ✅ Schema additions (members/settings/activity, view → function swap) — Phase 1
- ✅ RLS per role matrix — Task 1.5 + 3.4 + 5.1 (member_self_insert)
- ✅ Patch existing device path to use the function — Phase 2
- ✅ Domain + data modules (members, settings, activity, auth) — Phase 3 + 2.1
- ✅ Shell primitives (Toaster, AvatarMenu, useConfirm, state components, BulkActionBar) — Phase 4
- ✅ Auth bootstrap (`@gmail.com` gate + member upsert) — Phase 5
- ✅ Overview screen (KPIs, lifecycle, group share, attention, activity) — Phase 6
- ✅ Members screen (list, role filter, summary, bulk, invite) — Phase 7
- ✅ Member profile (header, details, devices managed, permissions, activity) — Phase 8
- ✅ Settings (admin-gated, 6 sections, save, purge) — Phase 9
- ✅ 404 / 500 — Phase 10
- ✅ Retrofit `logActivity()` into device + catalog actions — Phase 11
- ✅ Re-verify already-implemented pages against updated HTML (Login, Device List, others) — Phase 12
- ✅ Final verification per acceptance checklist + subagent fidelity — Phase 13
- ✅ i18n new namespaces in en.json + vi.json — added incrementally per phase

**Explicit deferrals (matches "Out of scope" in spec):**
- No mobile shell
- No real Supabase auth invite email
- No DB triggers for activity (app-layer only)
- No unit tests
- "Devices managed" count column on Members table defaults to "—" in v1; can be added later
