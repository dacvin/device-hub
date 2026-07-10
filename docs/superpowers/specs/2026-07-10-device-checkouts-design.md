# Device Check-outs — Design

**Date:** 2026-07-10
**Branch:** v2
**Status:** Approved design, pre-implementation

## Purpose

Let the IT department lend devices to people. An operator can check a device
out to a borrower (recorded as free text), see at a glance that a device is
checked out — how many units, to whom, and by whom — attach proof-of-lending
photos and an expected return date, and later check units back in with a return
condition and proof-of-return photos.

Devices carry a `quantity`, so lending is **per-unit**: some units of a record
can be out while others stay on the shelf. Returns are recorded as discrete
events, so a single check-out can be returned in installments, with units that
never come back written off as missing.

## Vocabulary

- **Check out** / **Check in** — the two actions.
- **Checkout** — one lending event (`checkouts` row).
- **Check-in** — one return event (`checkins` row); a checkout can have many.
- A device with outstanding units is **checked out**; a checkout past its
  expected return date is **overdue**.

## Data model

### `public.checkouts` — one row per lending event

| Field | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `device_id` | uuid → devices | `on delete restrict` |
| `borrower_name` | text not null | free-typed borrower |
| `quantity` | int not null, ≥1 | units lent — immutable record of what went out |
| `checked_out_by` | uuid → users | who lent it; default `public.app_user_id()` |
| `checked_out_at` | timestamptz not null | default `now()` |
| `expected_return_date` | date, null | overdue detection |
| `photos` | jsonb not null `'[]'` | proof-of-checkout; file-descriptor array |
| `notes` | text, null | |
| `created_at` / `updated_at` | timestamptz | `set_updated_at` trigger |

### `public.checkins` — many per checkout (installment returns)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `checkout_id` | uuid → checkouts | `on delete restrict` |
| `outcome` | `checkin_outcome` enum, not null | `normal` \| `consumed` \| `other` (see below) |
| `quantity` | int not null, ≥1 | units this event accounts for |
| `condition` | int, null, 0–100 | condition of returned units (`normal` only) |
| `photos` | jsonb not null `'[]'` | proof-of-return; file-descriptor array |
| `notes` | text, null | e.g. what was consumed / why units are lost |
| `split_to_device_id` | uuid → devices, null | set if this return spun off a record |
| `checked_in_by` | uuid → users | default `public.app_user_id()` |
| `checked_in_at` | timestamptz not null | default `now()` |
| `created_at` | timestamptz | |

**`checkin_outcome` enum** — the disposition of the units in this event
(English slugs; the UI localizes EN/VI, same convention as `device_status`):

- **`normal`** — units come back to inventory. Includes the *split* case where
  returned units differ in condition. `condition` and the split toggle apply.
- **`consumed`** — *tiêu hao*: a consumable device whose units are meant to be
  used up and won't return. Units leave inventory (expected).
- **`other`** — lost / damaged / otherwise unrecovered. Units leave inventory
  (unexpected — an incident worth recording).

One outcome per check-in event; a return that mixes dispositions (some back,
some consumed) is recorded as multiple check-in events against the same
checkout (installments already support this).

### `public.devices` — additive column

| Field | Type | Notes |
|---|---|---|
| `split_from_device_id` | uuid → devices, null | provenance: this record was split off from another on check-in |

The file-descriptor shape for `photos` reuses the existing device convention:
`{ path, file_name, size_bytes, mime_type, sort_order, uploaded_at }`.

## Quantity accounting

`device.quantity` is the **total units owned** in that record. It is **never
mutated on check-out** — availability is derived.

- `checkout.outstanding = quantity − Σ checkins.quantity`
  — the checkout is **closed** when this reaches 0 (every check-in, whatever its
  outcome, reduces outstanding).
- `device.on_loan = Σ outstanding` over the device's checkouts.
- `device.available = device.quantity − device.on_loan`.

**Invariant:** `device.available >= 0` at all times. A check-out (or edit) that
would push it negative is rejected by a `before insert/update` guard trigger on
`checkouts`.

## Lifecycle & rules

### Check out

Inputs: `device_id`, `borrower_name`, `quantity` (1…available),
`expected_return_date?`, `photos?`, `notes?`. `checked_out_by` and
`checked_out_at` are set automatically. Rejected when `quantity > available`.

Plain insert into `checkouts`, guarded by the availability trigger.

### Check in

A check-in records one outcome event against a checkout with an `outcome` and a
`quantity` (`q`), where `q >= 1` and `q <= checkout.outstanding`. Behaviour by
outcome:

- **`consumed` / `other`:** `device.quantity -= q` — the units leave inventory
  (the outcome distinguishes expected consumption from an incident; the reason
  belongs in `notes`). No condition or split.
- **`normal`, split toggle OFF (default):** the `q` units rejoin the shelf
  automatically (outstanding drops, availability rises). If a `condition` was
  entered, **`device.condition` is overwritten** with it. (This touches the
  whole record — accepted; the split path is the accurate route when unit
  conditions diverge.)
- **`normal`, split toggle ON:** `device.quantity -= q`, and a **new device
  record** is created — `quantity = q`, `condition = checkin.condition`,
  remaining attributes copied from the source device, `code` = next `DEV-###`
  (pre-filled, editable), `split_from_device_id` → the source device. The new
  device id is stored on the check-in as `split_to_device_id`.

Because a check-in touches multiple tables that must stay consistent, it runs
as a **single `public.check_in` RPC / transaction** — not multiple client-side
writes. The RPC is `SECURITY INVOKER`: the authenticated RLS policies already
permit every write it performs, so no privilege escalation is needed. Check-out
is a plain insert (no RPC), guarded by the availability trigger.

### Overdue

A checkout is overdue when `expected_return_date < today` AND
`outstanding > 0`.

### Edge cases

- `consumed` / `other` check-ins: condition and split are not applicable and the
  UI disables them (only `normal` exposes condition + the split toggle).
- A checkout that already has check-ins is **not hard-deletable** — it is
  history. (Correcting a mistaken checkout with no check-ins yet may delete it.)
- A split-off child is a normal device and can itself be checked out.
- Split with a condition equal to the source's is allowed — the operator may
  want a separate record regardless.

## UI surfaces

### 1. Checkouts page (`/checkouts`) — its own nav item

Overview of "who has what". Table across all devices: device (code + name),
borrower, outstanding/total qty, checked-out-by, checked-out-at, expected
return. Status column **Outstanding / Overdue / Closed** with filter tabs;
search by borrower or device.

### 2. Device detail page — Checkouts panel

Added to the existing detail layout:
- Availability line, e.g. *"3 of 5 available · 2 checked out"*.
- List of active checkouts (borrower, outstanding qty, checked-out-by, expected
  return + overdue badge), each with a **Check in** action.
- A **Check out** button (disabled when `available = 0`).
- Per checkout, its check-in history (outcome / quantity / condition / photo
  thumbnails).

### 3. Device list

A compact *"N out"* badge on rows that have outstanding checkouts.

### 4. Check-out dialog

Borrower (text), quantity (max = available), expected-return (reuse the shadcn
date picker), photos (reuse the device photo-field pattern), notes.

### 5. Check-in dialog

Outstanding shown. An **outcome** selector (**normal** / **consumed (tiêu hao)**
/ **other**) and a `quantity` (≤ outstanding). When outcome = **normal**:
condition input, photos, notes, and the **"return as a separate record" toggle
(default off)** — when on, a pre-filled, editable `DEV-###` for the new record.
When outcome = **consumed** / **other**: condition and split are hidden; photos
and notes remain (proof / reason).

## Infrastructure & API

- **Schema** (`supabase/schemas/checkouts.sql`): the two tables,
  `set_updated_at` + `log_activity` triggers on both, the availability-guard
  trigger on `checkouts`, and the `check_in` RPC. Additive
  `devices.split_from_device_id` column in `supabase/schemas/devices.sql`.
  Migrations generated via `supabase db diff` (never hand-authored).
- **Storage**: a new bucket for checkout / check-in photos declared in
  `supabase/schemas/_core.sql`; extend the storage RLS whitelist and the
  `/api/device-media/[bucket]` proxy whitelist to include it. Reuse the JSONB
  descriptor + photo-field components.
- **RLS**: `checkouts` / `checkins` → authenticated full CRUD (mirrors
  `devices`); `revoke all … from anon`; grant to `authenticated` +
  `service_role`. `checked_out_by` / `checked_in_by` default from
  `public.app_user_id()`.
- **Activity log**: `log_activity` trigger on both tables so events surface in
  the existing device activity feed; the feed component is extended to render
  checkout / check-in entries.
- **Feature code**: new `features/checkouts/{types,constants,validations,
  components,api}` mirroring `features/devices`; root `getXxxQueryOptions()`
  owns the bare query key, other queries build on it, mutations invalidate it;
  zod for forms and RPC args; camel/snake boundary via `camelcase-keys`.
  Regenerate `types/database.types` after the migration.
- **i18n**: EN/VI strings in `messages/*.json`; every UI string localized.

## Testing

- **pgTAP** (`supabase/tests`): schema shape, table grants, RLS policies, the
  availability invariant (over-checkout rejected), and the `check_in` RPC —
  covering each outcome (normal-merge, normal-split, consumed, other),
  installment returns, condition-override, and overdue derivation.
- **Frontend**: verified live via Playwright MCP (desktop + mobile); the client
  has no unit tests by project convention.
- **Gate**: `pnpm lint:fix` → `pnpm build` → `pnpm run format:fix`.

## Out of scope (v1)

- General device "split" as a standalone catalog operation (only the
  check-in-driven split exists here).
- Linking borrowers to member accounts (borrower is free text only).
- Notifications / reminders for overdue checkouts.
