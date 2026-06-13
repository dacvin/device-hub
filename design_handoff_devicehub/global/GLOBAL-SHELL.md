# Global shell — chrome shared by every authenticated page

Everything here is injected once by `reference_html/theme/shell.js` and reused on every page
**except** the auth pages (Login, Forgot Password) which are full-bleed and have no shell. In
Next.js this is your **`app/(app)/layout.tsx`**. Helpers live on `window.DH` in the mock
(`shell.js` + `states.js`) — recreate them as React components / hooks.

A page in the mock is just `<div id="page" data-title data-crumb data-active>…</div>` plus an
optional `<template id="topbar-actions">`. The shell reads those and builds the frame around them.

---

## 1. Layout frame

```
┌──────────┬─────────────────────────────────────────────┐
│ SIDEBAR  │ TOPBAR  (sticky, 58px, blurred bg)            │
│ (210px)  ├─────────────────────────────────────────────┤
│  brand   │ CONTENT  (max-width 1320px, centered,         │
│  nav     │           padding 28px, pb 104px for bulk bar)│
│  …       │                                               │
│  userchip│                                               │
└──────────┴─────────────────────────────────────────────┘
```
- **Sidebar** fixed ~210px, surface `--sidebar` (green-50 tint). Below **980px** it slides off-canvas
  behind a `.nav-scrim`; a hamburger (`menu` icon) in the topbar opens it; tapping scrim closes.
- **Topbar** sticky, `background: color-mix(--background 86%, transparent)` + `backdrop-blur(8px)`,
  bottom border. Left: hamburger (mobile only) + **title** (the page's `data-title`, 22/600) and
  optional **crumb** subtitle (`data-crumb`, muted). Right: `.actions` = the page's
  `topbar-actions` template (search box, Export, primary CTA…). Below **640px** the actions wrap to
  a full-width row and the search box goes 100% width.

---

## 2. Sidebar navigation

Three labelled groups (data in `shell.js → NAV_MAIN/NAV_CATALOG/NAV_SYSTEM`):

| Group | Item | Icon | Route | Notes |
|---|---|---|---|---|
| (main) | Overview | layout-dashboard | `/` | |
| (main) | Devices | hard-drive | `/devices` | trailing **count pill** (`12` in mock) = total devices |
| Catalog | Groups | layers | `/catalog/groups` | |
| Catalog | Units | boxes | `/catalog/units` | |
| Catalog | Manufacturers | factory | `/catalog/manufacturers` | |
| System | Members | users | `/members` | Admin-only surface |

**Nav item states:** default muted; **hover** → `--muted`/accent bg; **active route** → secondary
(mint) bg + foreground text (the `active` class, set from `data-active`). Each row = icon + label,
9px gap, `--radius-md`, ~9px padding.

**Brand** (top of sidebar): square primary tile with `hard-drive` glyph + wordmark "Device" (fg) +
"Hub" (primary). Clicking it should route to `/` (Overview).

---

## 3. User chip + user menu (popover)

Bottom of the sidebar: **`.userchip`** = avatar (initials "AT" on primary) + name "Anh Tran" +
role "Admin" + a `chevrons-up-down` glyph. Click → **popover menu** anchored above it:

| Item | Action |
|---|---|
| header (avatar · name · `anh.tran@sioux.asia`) | — |
| **View profile** (`user`) | → `/members/[email]` (own member profile) |
| **Language** (`languages`) — inline `<select>` EN / Tiếng Việt / 中文 | persists `localStorage["dh-lang"]`, toasts "Language updated". (i18n is stubbed — wire to your i18n lib.) |
| **Dark/Light mode** toggle (`moon`/`sun`) | flips `.dark` on `<html>`, persists `localStorage["dh-theme"]` |
| **Sign out** (`log-out`, danger) | opens **confirm** ("Sign out?", warn tone) → `/login` |

Closes on outside-click. Build as shadcn **`<DropdownMenu>`** + `next-themes` for the toggle.

---

## 4. Toast — `DH.toast(title, {type, desc, duration})` → `sonner`

Bottom-right region, stacks upward. Variants **success** (default, `circle-check-big`), **error**
(`circle-alert`, red icon, `role="alert"`), **info** (`info`, sky icon). 280–380px, popover shadow,
leading icon + title (13.5/600) + optional desc (12.5 muted) + close (`x`). Auto-dismiss 4000ms;
fade+translate in/out. Fired after virtually every mutation — see each page doc for exact copy.

## 5. Confirm dialog — `DH.confirm({title, desc, confirmLabel, icon, tone, onConfirm})` → `<AlertDialog>`

Centered modal, max-width 420px (full-bleed < 640px), `role="alertdialog"`. Leading rounded icon
tile (red tint for **danger**, amber for **warn**) + title + desc; footer = Cancel (outline) +
confirm button (**destructive red** for danger tone, **primary** for warn tone). Closes on overlay
click or **Esc**; confirm button is focused on open. Used for every destructive/irreversible action
(delete device, remove member, deactivate, sign-out, leave-without-saving, reset password).

## 6. Bulk-action bar — `DH.bulkBar()` → custom floating bar

Floating pill, bottom-center, appears (`.show`) when ≥1 row is selected. Layout: **"N selected"** ·
separator · **action buttons** (page-specific) · **clear (`x`)**. `raised` variant sits higher to
clear the Device-List view switcher. Actions per page:
- **Device List / catalogs:** Export · Delete.
- **Members:** Role (opens a popover of roles) · Reset password · Deactivate · Remove.
Selecting uses a `Set` of primary keys; header checkbox = select-all-in-view with indeterminate.

## 7. Popover menu — `DH.popoverMenu(anchor, items, opts)` → `<DropdownMenu>`

Generic anchored menu (`items: [{label, icon, danger, onClick} | {sep:true}]`, optional `head`
label, `above` flag). Used by: Device-Details "⋯ more" menu, Members bulk-Role picker. Auto-flips to
stay on-screen; closes on outside-click.

## 8. Variation switcher — mock-only, DO NOT SHIP

`DH.variantSwitcher()` renders a floating tab bar used in the prototype to toggle design options
(e.g. Device List **Table/Cards**, and detail/form layout variants). It is a **prototyping
affordance**, not a product feature. Where a switcher gates two real layouts, pick the documented
default (noted per page) and drop the switcher.

---

### Shell helper → React mapping
| `window.DH` helper | Recreate as |
|---|---|
| `statusBadge` / `flagChips` / `initials` | small presentational components / utils |
| `toast` | `sonner` `toast()` |
| `confirm` | `<AlertDialog>` (a `useConfirm()` hook is convenient) |
| `popoverMenu` | `<DropdownMenu>` |
| `bulkBar` | a `<BulkActionBar>` driven by a selection store |
| `variantSwitcher` | **omit** |
| `sk.*`, `errorState`, `emptyState`, `permissionDenied` | loading/empty/error components (see states/) |
