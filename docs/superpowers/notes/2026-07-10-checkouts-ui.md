# Checkouts UI — design decisions

**Date:** 2026-07-10 · **Scope:** Task C1 (design only, no code). Anchors every
decision to the existing "Instrument Console" system — no new tokens, no new
visual language. Implementers (C2–C6): follow this literally; deviate only if
you hit a concrete technical blocker, and note why.

Design skill used: `frontend-design` (guidance only — output below is
constrained to existing tokens/components, not a new aesthetic).

## Shared conventions

- **Status badge tones** (soft pill: `bg-status-*-soft text-status-*` + dot,
  exactly `DeviceStatusBadge`'s shape):
  - Checkout status — `outstanding` → `status-in-use`, `overdue` →
    `status-retired`, `closed` → `status-storage`.
  - Check-in outcome — `normal` → `status-in-use`, `consumed` →
    `status-repair` (amber — expected but notable), `other` → `status-retired`.
  - Colour never carries meaning alone; label text is always visible (same
    rule as `device-status-indicator.tsx`).
- All counts/quantities/dates-as-numbers/codes: `font-mono tabular-nums`.
- No new shadcn primitive beyond **`radio-group`** (not vendored; only
  `switch`/`checkbox` exist today — run `pnpm dlx shadcn@latest add
  radio-group`). Everything else (`Dialog`, `Field`, `Switch`, `Textarea`,
  `Input`, `Button`) is already vendored.
- Disclosure (check-in history) uses a plain `useState` + chevron rotation,
  not a new `Collapsible` primitive — matches this app's minimal-dependency
  style; no Radix Collapsible is vendored and none is needed.

---

## 1. `/checkouts` page

`PageLayout` (`fill`) — same shell as `devices-client.tsx`.

- **Status tabs**: mirror `CatalogTabs` exactly — underline nav, `border-b`,
  `-mb-px flex gap-6`, active = `border-primary text-foreground border-b-2`,
  inactive = `text-muted-foreground border-transparent`. Tabs: **All /
  Outstanding / Overdue / Closed**, each with a `font-mono tabular-nums`
  count suffix (e.g. "Overdue 3") — the count is real queue information, not
  decoration. Tabs drive the `DataTable` `status` column filter client-side
  (no refetch); default tab = **Outstanding**.
- **Search**: reuse `DevicesToolbar`'s search input exactly (icon-left
  `Search`, `Input`, `bg-card pl-8`) over device code/name + borrower name
  (`globalFilterFn`).
- **Columns** (`DataTable` + `deviceColumns`-style `ColumnDef`s):
  1. Device — `font-mono` code (link to `/devices/:id`, `text-primary
     hover:underline`) stacked over name, same as `devices-columns.tsx`.
  2. Borrower — plain text.
  3. Qty — `outstanding/quantity`, e.g. `2/4`: outstanding bold, `/total`
     muted, both `font-mono tabular-nums`.
  4. Checked-out-by — muted text, dash (`t('empty')`) if null.
  5. Checked-out-at / Expected-return — `Intl.DateTimeFormat` medium, dash if
     null. Collapse both under `hidden lg:table-cell` at narrow widths like
     the devices table does for manufacturer/location.
  6. Status — badge, tone mapping above.
  7. Actions — icon-only **Check-in** button (`IconButton`, `variant="ghost"
     size="icon-sm"`), disabled/hidden for `closed` rows.
- **Overdue row emphasis**: badge alone is sufficient per the app's own rule,
  plus a subtle **`border-l-2 border-l-status-retired`** on overdue rows only
  — scannable in a queue without a full red row-fill (too loud for a data
  table).
- **Empty state**: mirror `devices-client.tsx`'s pattern (muted icon circle +
  title + description); no CTA (checkouts are created from a device, not
  from this page).
- **Mobile**: use `DataTable`'s `renderMobileCard` — card per checkout:
  device name+code top, status badge top-right, borrower prominent,
  outstanding/expected-return as two-line meta below. Tap navigates to the
  device (consistent with `DeviceMobileCard`); the Check-in action stays a
  small button inside the card, not a swipe gesture.

---

## 2. Check-out dialog

Straight mirror of `CatalogFormDialog` + `device-form.tsx`'s `Field`/zod
wiring — nothing novel here.

- shadcn `Dialog`, `DialogContent className="sm:max-w-md"`.
- `DialogHeader` → `DialogTitle` = "Check out {deviceName}".
- Single-column form, `space-y-4`, TanStack Form + `checkoutFormSchema`:
  1. **Borrower** — `Input`, autofocus, required.
  2. **Quantity** — `Input type="number"` `min=1 max={available}`; helper
     text under the field: `"{available} available"`
     (`text-muted-foreground text-xs`).
  3. **Expected return** — existing `DatePicker` component, optional.
  4. **Photos** — reuse `DevicePhotosField` pattern verbatim, backed by a
     `useDeviceMedia([], { withPreview: true })` instance scoped to the
     checkout-photos bucket.
  5. **Notes** — `Textarea`, optional.
- `DialogFooter`: Cancel (`variant="outline"`) + submit button with
  `Loader2` spinner while pending; submit disabled when `available <= 0` or
  `!canSubmit` (mirror `CatalogFormDialog`'s `form.Subscribe` pattern).

---

## 3. Check-in dialog (outcome-driven — the hard one)

shadcn `Dialog`, `DialogContent className="sm:max-w-md"`. `DialogTitle` =
"Check in {deviceName}". Directly under the title, a static meta line (not a
form field): **"{outstanding} of {quantity} outstanding"** —
`text-muted-foreground text-sm`, numbers `font-mono tabular-nums`.

Field order top to bottom:

1. **Outcome** — `RadioGroup` rendered as **3 segmented cards in a row**
   (`grid grid-cols-3 gap-2`), not bare radio dots and not a pill/segmented
   toggle. Each option is a `RadioGroupItem` + `Label` wrapped in a bordered
   button-shaped div: outcome name (via `CHECKIN_OUTCOME_LABEL_KEY`) + a
   one-line descriptor underneath (e.g. "Back to inventory" / "Used up" /
   "Lost or damaged"). Selected state: `border-primary bg-accent
   text-accent-foreground`; unselected: `border-input`. Cards, not dots,
   because this choice reshapes the form below it — the descriptor removes
   ambiguity between "consumed" and "other" at a glance.
2. **Quantity** — `Input type="number"` `min=1 max={outstanding}`, applies
   to every outcome, sits directly below the outcome selector.
3. **Conditional block** (`condition` + split toggle) — visible only when
   `outcome === 'normal'`. **Layout stability**: the wrapper `div` always
   renders; only its height animates. Use a CSS grid-rows trick to avoid
   layout jank without JS measurement:
   ```
   grid transition-[grid-template-rows] duration-150 ease-out
   grid-template-rows: 0fr   (outcome !== 'normal')
   grid-template-rows: 1fr   (outcome === 'normal')
   → inner div: overflow-hidden, min-height: 0
   ```
   Contents, in order:
   - **Condition** — `Input type="number"` 0–100, same pattern as
     `device-form.tsx`'s `fieldCondition`. Optional.
   - **Split toggle** — shadcn `Switch` + label "Return as a separate
     record", default off. A peer field to condition, not nested under it.
   - **Split code** (only when the toggle is on) — a **second**, faster
     (~120ms) grid-rows reveal, indented `border-l pl-4 ml-1` under the
     toggle row to read as "child of the toggle." `Input`, pre-filled with
     the next `DEV-###` (from the devices API), always editable.
4. **Photos** — same `DevicePhotosField` pattern, always shown regardless of
   outcome (proof of condition, or proof of loss/consumption).
5. **Notes** — `Textarea`, always shown (reason for consumed/other, remarks
   for normal).

`DialogFooter`: Cancel + submit (spinner while pending, label "Check in").
Server-side "exceeds outstanding" RPC errors surface as an inline `FieldError`
under the quantity field (not a toast — it's a correctable input error).

---

## 4. Device-detail Checkouts panel

A `Section` (existing icon-chip + uppercase-tracked-label header) in the main
column, placed near the Media section, per the plan. Icon: `ArrowLeftRight`.

- **Header row** inside `CardContent`, `flex flex-col gap-3 sm:flex-row
  sm:items-center sm:justify-between` (stacks on mobile):
  - Availability line: `"{available} of {total} available"` (regular text)
    `· {onLoan} checked out` (`text-muted-foreground`) — all numbers
    `font-mono tabular-nums`.
  - **Check out** button (`size="sm"`), disabled when `available <= 0`, with
    a `title` attr explaining why (no tooltip primitive vendored — plain
    `title` is enough).
- **Active checkouts** — a plain stacked list (`divide-y`), *not* a
  `DataTable* — this is a small, scoped list inside a card; a full table is
  overkill. Per row:
  - Line 1: borrower (`font-medium`) + `outstanding/quantity`
    (`font-mono tabular-nums`) right-aligned.
  - Line 2 (`text-muted-foreground text-sm`): checked-out-by · expected
    return date, with the overdue badge (`status-retired` soft pill) inline
    next to the date when the checkout `status === 'overdue'`.
  - Right-aligned **Check in** button (`variant="outline" size="sm"`) —
    opens the check-in dialog for that checkout.
  - Below the row: a `variant="ghost" size="sm"` disclosure trigger, **"Check-in
    history ({n})"** with a chevron that rotates on toggle, collapsed by
    default. Expanded: one compact line per check-in — outcome soft-badge,
    quantity, condition (if present), and photo thumbnails as a small
    `size-10 rounded-md` row (same tile idiom as `DevicePhotosField`'s grid,
    just smaller, no crop/reorder controls — this is read-only history).
- **Closed checkouts** — listed below active ones, visually deemphasized
  (`text-muted-foreground`, no Check-in button), collapsed to just their
  disclosure trigger by default (pure audit trail).
- **Empty state** (no checkouts at all): muted icon + one line, "No devices
  are checked out." — no duplicate CTA since Check out is already in the
  header.
- **Mobile**: the list already stacks vertically (not a table), so no
  special mobile variant beyond the header's `flex-col sm:flex-row`
  reflow above.
