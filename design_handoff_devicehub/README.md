# Handoff: DeviceHub — IT asset & inventory portal

> **Read me first.** This package documents a complete, hi-fi design for **DeviceHub**,
> an internal web app for tracking an organisation's device fleet (laptops, monitors,
> servers, printers…) — registering devices, browsing/filtering the inventory, managing
> the supporting catalogs (groups, units, manufacturers), and administering members.

---

## 1. About the design files (read this before coding)

The files in `reference_html/` are **design references created in HTML** — faithful,
interactive prototypes of the intended look and behaviour. **They are not production code
to copy.** They are deliberately built as static mockups: one shared "shell" script injects
the nav/topbar, and each page renders from a small seed-data array. Do **not** port that
architecture.

**Your task:** recreate these designs in the target codebase — **Next.js (App Router) +
shadcn/ui + Tailwind v4** — using real routing, real components, and the existing backend.
The prototypes already speak shadcn's visual language (they are a hand-rolled CSS mirror of
shadcn defaults over a custom token set), so the mapping is direct: every mockup element has
a shadcn equivalent. A cheat-sheet is in §7.

**Fidelity: HIGH.** Colours, type, spacing, radii, shadows, hover/active/focus states, and
interaction flows are all final. Recreate pixel-faithfully using shadcn components themed
with the provided tokens — don't approximate.

---

## 2. How this package is organised

```
design_handoff_devicehub/
├── README.md                  ← you are here (system-level: tokens, nav, roles, responsive)
├── types/
│   └── devicehub.ts           ← canonical domain types: interfaces, enums, derived fns, validation-as-JSDoc
├── design-system/
│   └── DESIGN-SYSTEM.md        ← tokens, type scale, full component inventory + every state
├── global/
│   └── GLOBAL-SHELL.md         ← app chrome shared by every page (nav, topbar, user menu, toast, confirm, bulk bar, popover)
├── pages/
│   ├── overview/               ← one folder per page: README.md (purpose, layout, section→data mapping,
│   ├── device-list/                clickables, states, dialogs) + images/ (every breakpoint + dialog + state)
│   ├── device-details/
│   ├── create-device/
│   ├── edit-device/
│   ├── groups/  units/  manufacturers/
│   ├── members/  member-profile/  profile/
│   └── login/  forgot-password/
├── mobile/
│   └── MOBILE.md               ← the purpose-built mobile layout (bottom-tab nav) + responsive contract
└── reference_html/             ← the runnable prototypes + theme CSS/JS + assets (open any *.html)
```

**Suggested reading order:** this README → `types/devicehub.ts` → `design-system/DESIGN-SYSTEM.md`
→ `global/GLOBAL-SHELL.md` → each `pages/*/README.md` alongside its screenshots → `mobile/MOBILE.md`.

Every page doc follows the same template: **Purpose · Route · Layout · Sections (with data→field
mapping) · Interactive elements (every link/button/control and what it does) · States · Dialogs &
dropdowns · Responsive.**

---

## 3. Target stack & component mapping

| Mockup construct | Build it as |
|---|---|
| `theme/shell.js` injected sidebar + topbar | Next.js **`layout.tsx`** with a shadcn **Sidebar** + sticky header |
| Page = `<div id="page">` rendered by JS | A **route** under `app/` rendering a server/client component |
| `.btn .btn-primary` etc. | shadcn **`<Button variant>`** (mapping in DESIGN-SYSTEM.md) |
| `.card` | shadcn **`<Card>`** |
| `.table` | shadcn **`<Table>`** (or TanStack Table for sort/paginate) |
| `.dialog-overlay/.dialog` | shadcn **`<Dialog>`** |
| `DH.confirm()` | shadcn **`<AlertDialog>`** |
| `DH.toast()` | **`sonner`** (`<Toaster>` + `toast()`) |
| `DH.popoverMenu()` / Columns menu / user menu | shadcn **`<DropdownMenu>`** |
| `.badge-{tone}` | shadcn **`<Badge>`** + tone variants |
| `.seg` / `.tabs` | shadcn **`<Tabs>`** or a segmented `<ToggleGroup>` |
| `.switch` | shadcn **`<Switch>`** · `.checkbox` → **`<Checkbox>`** |
| lucide `<i data-lucide>` | **`lucide-react`** (`<Laptop/>`, `<Plus/>`, …) — same names |
| Upload dropzones (`uploads.js`) | your file-upload component (e.g. react-dropzone) |

Fonts: **Geist** (sans) + **Geist Mono** (code/IDs/serials) — use `next/font` (`geist` package).

---

## 4. Design tokens (summary — full detail in DESIGN-SYSTEM.md)

The theme is a **green skin for shadcn/ui**. Structure is stock shadcn; only the colours change.
Tokens live in `reference_html/theme/tokens.css` — **copy that file verbatim** into your
`globals.css` (it is already a Tailwind v4 `@theme inline` token block + `.dark` overrides).

- **Brand:** a single green ramp 50→950. Light primary `--primary` = green-600 `#2FA084`; dark
  mode flips to mint green-300 `#6FCF97` with dark-pine text.
- **Neutrals carry the UI**; green is a deliberate accent, not wallpaper.
- **Radius:** `--radius` 0.625rem; cards use `--radius-xl`, buttons/inputs `--radius-md`, pills 9999px.
- **Type:** Geist. Scale 12/13/14/16/18/22/28. Page titles 22–24/600. Body 14/400. Mono for codes.
- **Dark mode** is first-class: toggle persists in `localStorage["dh-theme"]`; recreate as a
  `class`-based theme (`next-themes`), tokens already provide both palettes.

---

## 5. Navigation map & URL conventions

Sidebar groups (see `global/GLOBAL-SHELL.md` for exact markup):

```
MAIN      Overview          /                (Overview.html)
          Devices  ⟨count⟩   /devices         (Device List.html)
CATALOG   Groups            /catalog/groups        (Groups.html)
          Units             /catalog/units         (Units.html)
          Manufacturers     /catalog/manufacturers (Manufacturers.html)
SYSTEM    Members           /members         (Members.html)
```
Off-nav routes: `/devices/new` (Create), `/devices/[code]` (Details), `/devices/[code]/edit`
(Edit), `/members/[email]` (Member Profile), `/profile` (own profile, via user menu),
`/login`, `/forgot-password`.

**Query-param contract** (used for cross-page filtering — preserve it):
- `/devices?group=Laptop` · `?status=in-use` · `?mfr=Dell` · `?flag=warranty` — pre-applies that
  Device-List filter. Catalog rows and the Overview charts link here.
- `/members/[email]` — Member Profile is keyed by URL-encoded email
  (e.g. `…?email=anh.tran%40sioux.asia` in the mock; use a real `[email]` segment).

---

## 6. Roles & permissions

Two roles (canonical desktop model). The mock signs you in as **Anh Tran · Admin**.

| Capability | Admin | Member |
|---|:--:|:--:|
| View inventory, device details | ✅ | ✅ |
| Create / edit / delete devices | ✅ | ✅ |
| Manage catalogs (groups/units/manufacturers) | ✅ | ✅ |
| Invite / edit / deactivate / remove **members** | ✅ | ❌ |
| Change member roles | ✅ | ❌ |

A **Member** hitting an admin-only surface should see the **Permission-denied** state
(`reference_html/states/Permission denied (Viewer).html`): a locked card with "Back to overview"
+ "Request access". `states.js → DH.permissionDenied()` is the reference. Self-actions are limited
too: a member can't deactivate/remove their own row (only "Edit my profile"). **Editing another
member's account is admin-only** and happens through the role dialog on Member Profile — `/profile`
only ever edits *your own* account, and resolving it to someone else's must show a permission-denied
state (see `pages/profile/README.md`).

---

## 7. Responsive contract

Pages are responsive; there is **also** a separate purpose-built mobile layout — see
`mobile/MOBILE.md`. The mock uses these breakpoints (recreate with the nearest Tailwind tokens):

| Mock px | Tailwind | What changes |
|---|---|---|
| ≤ **980** | `< lg` | Sidebar becomes an **off-canvas drawer** behind a hamburger + scrim; layout goes single-column. |
| ≤ **1080** | ~`lg` | Overview dashboard & detail/profile 2-col grids collapse to 1 col; Overview KPIs go 4→2 up. |
| ≤ **1000** | ~`lg` | Create/Edit form: the sticky section-nav rail is hidden; form goes full width. |
| ≤ **880** | ~`md`/`lg` | Members role-summary cards stack; Login/Forgot hide the art pane → single column. |
| ≤ **640** | `< md` | Topbar wraps (title row + full-width actions row); dialogs go full-bleed; all `fgrid/dl/kpis` → 1 col. |
| tables | — | Wide tables keep a `min-width` and **scroll horizontally** inside their card rather than reflowing. |

Capture widths used for the screenshots in each page folder: **1440 (xl), 1024 (lg), 768 (md),
390 (mobile)**, light + dark where relevant.

---

## 8. Assets & fonts

- **Fonts:** Geist + Geist Mono (Google Fonts in the mock; use `next/font` `geist` package).
- **Icons:** lucide (≈70 names used). Each page doc lists the icons it uses. Use `lucide-react`.
- **Device photos:** `reference_html/assets/devicephotos/*.png` — 8 sample cover images keyed by
  device code. Illustrative; real photos come from the upload flow.
- **Logo/brand:** the wordmark is **set live in type**, not an SVG — "Device" in `--foreground`,
  "Hub" in `--primary`, with a square `hard-drive` lucide glyph in a primary tile. No raster logo.
- **No login cover photo** — the auth pages use a CSS gradient + grid-motif art pane (deep-pine
  gradient `#277E69 → #1F6F5F → #103A33`).

---

## 9. Data model reconciliation

The desktop surface is canonical, and the mobile mock (`reference_html/mobile/`) has now been
**reconciled** to it — same roles (Admin/Member), catalogs (Groups/Units/Manufacturers), status keys,
and no `dept`. The mapping that was applied is recorded at the bottom of `types/devicehub.ts`; both
surfaces bind the same types. (The Device-List **Cards** view was likewise moved to canonical fields —
the phantom `Department` cell is gone.)

---

## 10. File index (reference_html/)

| Prototype | Documents |
|---|---|
| `Overview.html` | Dashboard — KPIs, lifecycle bar, group bars, attention list, activity |
| `Device List.html` | Inventory table + cards view, filters, columns menu, bulk bar, row/empty states |
| `Device Details.html` | Single device — identity, specs, allocation, lifecycle, warranty, notes, condition ring, activity; "more" menu |
| `Create Device.html` | New-device form (single-page + stepped variants), uploads, unsaved-changes guard |
| `Edit Device.html` | Edit form (prefilled) + delete |
| `Groups.html` / `Units.html` / `Manufacturers.html` | Catalog tables (shared `catalog.js`) + create/edit dialog + delete-guard |
| `Members.html` | Member table, role filter, role-summary cards, invite/edit dialog, bulk actions |
| `Member Profile.html` | One member — details, activity, (self) security; admin actions + role dialog |
| `Profile.html` | Own profile — personal info, avatar upload, change password |
| `Login.html` / `Forgot Password.html` | Auth — split layout, art pane, reset flow w/ success state |
| `DeviceHub Mobile.html` | Gallery of the purpose-built phone screens |
| `DeviceHub Theme.html` | The living theme/style reference (palette, ramp, tokens, type, components) |
| `theme/*` | Shared tokens, component CSS, shell, state helpers, catalog renderer, uploaders, seed data |
| `states/*` | Loading / empty / error / 404 / 500 / permission-denied / validation variants |
