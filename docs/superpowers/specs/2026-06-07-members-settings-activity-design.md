# Members, Settings & Activity — design spec

**Date:** 2026-06-07
**Status:** Approved (initial scope; extensible)

## Scope

Implement the revision called out in `design_handoff_devicehub/README.md` ("What changed in this revision"):

- **DB:** members & access (handoff `003`), settings (handoff `004`, including the `device_with_flags` view → `devices_with_flags()` function swap), activity log (handoff `005`)
- **Screens:** Overview dashboard, Members list, Member profile, Settings
- **Cross-cutting:** avatar menu, toast (Sonner), confirm dialog (AlertDialog), skeleton/error/empty/permission-denied state primitives, 404/500 pages, full RLS per the handoff role matrix

The existing screens (Login, Device list, Device details, Create/Edit device, Departments, Groups, Manufacturers) keep their current behavior. The only existing code that changes is `lib/data/devices.ts` (view → function swap) and the auth callback (member bootstrap).

## Key decisions

| Decision | Choice | Why |
|---|---|---|
| Spec scope | One big spec covering everything | User chose |
| `member.id` ↔ `auth.users.id` | Same uuid | Cleanest RLS, `auth.uid()` works directly; no email-based join |
| Activity write strategy | App-layer `logActivity()` helper called from each Server Action | Easy actor/metadata attribution; DB-only writes are out of scope |
| i18n | Yes — follow existing next-intl pattern | Matches every existing screen |
| Invite flow | Insert `member(status='invited')` only — no auth email yet | Visually matches the mock; defers email integration |
| RLS scope | Full per the handoff sketch | Production-correct from day one |
| Member profile URL | `/members/[id]` (uuid) instead of `?email=` | Matches Next.js convention and the existing `/devices/[code]` pattern |
| Permission-denied UX | Route RSC checks `can(role, capability)` and **renders** `<PermissionDenied />` instead of redirecting | RLS is the real enforcement; UI is the friendly fallback |

## Architecture

### Schema additions (`supabase/schemas/`)

Mirror the handoff migration files into the existing schema split. Generate one consolidated migration via `supabase db diff`. Never hand-author migration SQL.

| File | Adds |
|---|---|
| `08_members.sql` (new) | `member_role` enum (`it_admin`/`manager`/`viewer`), `member_status` enum (`active`/`invited`/`disabled`), `member` table (PK `id uuid` populated from `auth.users.id`; self-FK `reports_to`/`invited_by`; FK `department_id`), `member_role_label()` immutable fn, indexes on `department_id` and `role` |
| `09_settings.sql` (new) | `org_settings` singleton table (boolean PK `= true` guard; seeded with one row); `user_preference` table (`user_id` FK → `member(id)`); `devices_with_flags(p_warranty_days int default 90)` function returning `device.*` + two derived booleans |
| `10_activity.sql` (new) | `activity_action` enum (per handoff list), `activity` table (nullable `actor_id` FK member, `entity_type` text, `entity_id` uuid, `entity_label` text, `metadata` jsonb), three indexes (created_at DESC; entity_type+entity_id+created_at; actor_id+created_at) |
| `03_view.sql` (modify) | **Remove** the `device_with_flags` view definition (replaced by the function in `09_settings.sql`) |
| `04_functions.sql` (modify) | Add `app_role()` and `app_dept()` SECURITY DEFINER helpers — see role-gating sketch in handoff |
| `06_rls.sql` (modify) | Enable RLS on `member`, `org_settings`, `user_preference`, `activity`; add/replace policies on `device`, `department`, `device_group`, `manufacturer` to enforce the role matrix |

**Knock-on:** `lib/data/devices.ts` currently selects from the `device_with_flags` view. After the view is dropped, it must call the function via `supabase.rpc('devices_with_flags', { p_warranty_days })`. The warranty-window value is read once per request from `org_settings`.

### Data layer (`client/src/lib/data/`, server-only)

New modules:

- **`members.ts`** — `listMembers(filters)`, `getMemberById(id)`, `inviteMember(input)` (status='invited'), `updateMemberRole(id, role)`, `removeMember(id)`, `getDevicesManagedBy(memberDeptId)` (derived from `device.department_id`, viewers return empty)
- **`settings.ts`** — `getOrgSettings()`, `getUserPreference(userId)`, `updateOrgSettings(patch)` (writes `updated_by`/`updated_at`), `upsertUserPreference(patch)`, `purgeRetiredDevices()` (respects `deleted_retention_days`)
- **`activity.ts`** — `listRecentActivity(limit)`, `listActivityForEntity(type, id)`, `listActivityByActor(memberId)`, and **`logActivity({ action, entityType, entityId, entityLabel, metadata })`** — called inside every mutating Server Action
- **`auth.ts`** — `getCurrentMember()` server-only helper: `member` row where `id = auth.uid()`; throws on missing (which never happens after the bootstrap below). Used for role gating in RSC and to set `actor_id` in `logActivity()`

Modified:

- **`devices.ts`** — switch every read from the `device_with_flags` view to `rpc('devices_with_flags', { p_warranty_days })`; thread the value from `getOrgSettings()`

### Domain layer (`client/src/lib/domain/`)

New modules:

- **`members.ts`** — `Member` row type, `MemberRole`, `MemberStatus`, Zod `inviteMemberSchema` (email regex ending `@sioux.asia`, role, department required), `ROLE_LABEL`, `ROLE_TONE`, `CAPABILITIES` matrix (the table in the handoff), `can(role, capability)` helper
- **`settings.ts`** — `OrgSettings` row type, `UserPreference` row type, Zod `orgSettingsSchema` (covers every editable field with the same checks as the DB), `userPreferenceSchema`
- **`activity.ts`** — `Activity` row type, `ActivityAction`, `ACTIVITY_META` mapping each action to `{ icon, verb }` for timeline rendering

Modified:

- **`devices.ts`** — `deriveFlags()` already exists; ensure its warranty-window option is wired from `org_settings.warranty_expiring_days` everywhere it's called (currently hardcoded — verify and patch)

### Auth bootstrap

Extend the existing auth callback at `client/src/app/auth/...` so that after Supabase confirms the user, we upsert into `member` with `id := auth.uid()`, `email`, `name` from `user_metadata`, `status := 'active'`. Idempotent; first-time login creates the row, subsequent logins are no-ops (or refresh `last_active_at`).

If the email is not in `@sioux.asia`, sign-out + redirect to login with an error toast (matches the handoff "Workspace-gated" requirement).

## Routes & screens

All under `client/src/app/(app)/`:

| Route | Files | Notes |
|---|---|---|
| `/overview` | `overview/page.tsx`, `overview/loading.tsx`, `overview/error.tsx` | RSC; reads devices + org_settings + recent activity; aggregates KPIs/status-share/group-share server-side. No mutations. |
| `/members` | `members/page.tsx`, `members/_actions.ts`, `members/_components/*`, `members/loading.tsx`, `members/error.tsx` | RSC list + Server Actions for invite/role/remove. URL params hydrate role filter + search. Bulk bar reused. |
| `/members/[id]` | `members/[id]/page.tsx`, `members/[id]/loading.tsx`, `members/[id]/error.tsx` | RSC; derives devices-managed by department; permissions card renders the `CAPABILITIES` matrix for the row's role. |
| `/settings` | `settings/page.tsx`, `settings/_actions.ts`, `settings/_components/*`, `settings/loading.tsx`, `settings/error.tsx` | RSC; admin-gated. Sections per handoff: General, Appearance (per-user), Inventory defaults, Notifications, Data & export, Condition thresholds, Danger zone. Sticky section nav + scrollspy; save bar reflects dirty state. |
| `/not-found` | `app/not-found.tsx` (top-level) | Branded 404 |
| Per-route `error.tsx` | as above | Branded 500 with request-id |

The sidebar already links to `/overview`, `/members`, `/settings` (currently 404). No nav changes needed.

## Shared primitives (`client/src/components/app/`)

- **`avatar-menu.tsx`** — replaces the static user chip block in `sidebar.tsx`. `DropdownMenu` (shadcn) anchored above the chip. Items: name+email header, View profile (→ `/members/[currentMember.id]`), Account settings (→ `/settings`), inline theme toggle, Sign out.
- **`bulk-action-bar.tsx`** — floating pill at viewport bottom-center; renders only when selection set is non-empty; props are action slots. Reused by Members and Device list (Device list bulk bar to be added to existing device-list component during this revision).
- **`confirm-dialog.tsx`** + **`use-confirm.ts`** — imperative wrapper around shadcn `AlertDialog`. `await confirm({ title, description, tone, confirmLabel })`. Tone `"destructive" | "warn"`.
- **`states/skeleton-page.tsx`** — exports KPI-row, table-row, card-grid, profile-page primitives.
- **`states/error-state.tsx`** — centered card; icon, title, description, Try again, mono request-id.
- **`states/empty-state.tsx`** — icon + title + 1–2 primary actions. Callers distinguish first-run vs filtered-empty.
- **`states/permission-denied.tsx`** — lock icon, role explanation, Back, Request-access (mailto stub).

**Toaster** (`sonner`) mounted in `app/(app)/layout.tsx`: `<Toaster richColors position="bottom-right" />`.

shadcn primitives to add via `shadcn add`: `alert-dialog`, `dropdown-menu`, `skeleton`, `progress`, `avatar`, `popover`. Verify `toggle-group` is present (used today for the device list view toggle).

## RLS

Per the handoff sketch in README §"Role-gating":

- Helper: `app_role()` and `app_dept()` (SECURITY DEFINER, STABLE).
- `device` — all roles `SELECT`; `INSERT/UPDATE/DELETE` for `it_admin` (any) and `manager` (only when `department_id = app_dept()`).
- `device_photo`, `device_document` — gate on the parent device's policy.
- `department`, `device_group`, `manufacturer` — all roles `SELECT`; writes restricted to `it_admin`.
- `member` — all roles `SELECT`; writes restricted to `it_admin`. Each member can `SELECT` their own row regardless.
- `org_settings` — `SELECT` all roles; `UPDATE` `it_admin` only.
- `user_preference` — `SELECT`/`UPDATE`/`INSERT` only where `user_id = auth.uid()`.
- `activity` — `SELECT` all authenticated members; `INSERT` only via service role (or a SECURITY DEFINER `logActivity()` SQL fn called from the app).

The UI gates are convenience; RLS is the security boundary.

## i18n

New message namespaces (added to every existing locale file in `client/src/messages/`):

- `overview` — KPI labels, section titles, attention-empty copy
- `members` — table columns, role labels (also surfaced via `ROLE_LABEL`), segmented filter, bulk actions, invite-dialog strings
- `memberProfile` — section titles, capability matrix row labels, devices-managed copy
- `settings` — section titles + every form label + helper text + danger-zone copy
- `activity` — verb phrases per `ActivityAction` (used by `ACTIVITY_META`)
- `states` — loading, error, empty (first-run + filtered), permission-denied, 404, 500
- `confirm` — generic Cancel / Confirm / dialog scaffolding
- `toast` — keyed success/error messages per action

All new copy goes through `useTranslations(namespace)`. The `nav` namespace already has `overview`/`members`/`settings` keys; verify on write.

## Implementation order

1. **Schema** — add `08`/`09`/`10` to `supabase/schemas/`, drop the view from `03`, expand `04`+`06`; `supabase db diff` → single migration; `supabase gen types`.
2. **Patch device path** — switch `lib/data/devices.ts` to `rpc('devices_with_flags', ...)`; thread warranty window from `org_settings`. Regression-check existing list/details.
3. **Domain + data modules** — `members`, `settings`, `activity` + `getCurrentMember()` + `logActivity()`.
4. **Shell primitives** — Sonner mount, `<AvatarMenu>`, `useConfirm`, state components, shadcn additions.
5. **Auth bootstrap** — upsert member on first sign-in; `@sioux.asia` gate.
6. **Overview** (read-only, lowest risk).
7. **Members** + invite/role/remove actions + bulk bar.
8. **Member profile**.
9. **Settings** + purge action (admin-gated).
10. **404 / 500**.
11. **Wire `logActivity()`** into every existing device/catalog mutation (touches `(app)/devices/_actions.ts` and the catalog `_actions.ts` files).

## Verification gates

- After step 2: existing Device list + Device details still render — full manual smoke pass.
- After step 3: `tsc --noEmit` clean; `supabase gen types` regenerated; no broken imports.
- After each new screen (steps 6–9): dispatch a subagent to verify the built result against the corresponding mock HTML/CSS (per `feedback_ui_fidelity_subagent_verify`).
- Final: every acceptance-checklist box in the handoff README §"Screens / Views" is true for the four new screens.

## Out of scope (for this spec — may be added later)

- Mobile shell (the `DeviceHub Mobile.html` design + `mobile/` overlay) — desktop reflow only for now.
- Real Supabase auth invite email (insert-only invite stub for now).
- Device-list bulk bar wiring beyond what's needed to share the primitive (the existing list grows a selection set; Status/Export/Delete actions stay as-is unless straightforward).
- Activity DB triggers (app-layer helper only).
- Code Connect / Storybook coverage of the new components.
