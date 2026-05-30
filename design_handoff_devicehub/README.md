# Handoff: DeviceHub — IT device-management portal

## Overview
DeviceHub is an internal IT asset-management web app. IT admins register
devices, browse/filter the inventory, inspect a device's full record, and manage the
lookup catalogs (departments, groups, manufacturers). This package contains hi-fi HTML
design references plus a **production-ready shadcn/ui theme** derived from the brand palette.

## About the design files
The HTML files in this bundle are **design references** — prototypes showing the intended
look and behavior. They are NOT meant to be shipped as-is. The task is to **recreate these
screens in the target codebase** (React + Tailwind v4 + shadcn/ui is the assumed stack, matching
the rest of the portal) using its established components and patterns.

**One exception — `theme/tokens.css` IS production code.** It's a drop-in shadcn theme
(see "Design tokens" below). Everything else (`components.css`, `shell.*`, the per-page
HTML/JS) is a vanilla-CSS *simulation* of shadcn so the mocks run standalone in a browser —
do not port that simulation; use the real shadcn components instead.

## Fidelity
**High-fidelity.** Final colors, typography (Geist), spacing, radii, and interactions are all
settled. Recreate pixel-faithfully using shadcn/ui primitives. Because the mocks already use
shadcn's token names and conventions, most screens map 1:1 onto stock shadcn components.

## Tech stack assumption
- **React + Tailwind CSS v4 + shadcn/ui** (the portal's existing stack).
- **Geist** + **Geist Mono** fonts.
- **lucide-react** for icons (the mocks use the lucide CDN; the names are identical).
- If no codebase exists yet, scaffold Vite + React + Tailwind v4 and run `npx shadcn@latest init`.

## How to apply the theme (start here)
1. Run `npx shadcn@latest init` (choose CSS variables, base color = neutral — you'll overwrite it).
2. Replace the generated `:root` / `.dark` color blocks in your `globals.css` with the blocks
   from **`theme/tokens.css`** in this bundle. It already defines every shadcn role
   (`--background`, `--primary`, `--card`, `--ring`, `--sidebar-*`, `--chart-*`, …) in both modes,
   plus the brand ramp (`--green-50` … `--green-950`).
3. The file's `@theme inline { … }` block is the Tailwind v4 token mapping — keep it; it exposes
   `bg-primary`, `text-muted-foreground`, etc.
4. Add `shadcn add` for the components listed per screen and you're skinned.

## Screens / Views

### 1. Login (`Login.html`)
- **Purpose:** Authenticate via Google SSO (Workspace-gated, no password).
- **Layout:** Full-viewport 2-column grid (`1fr 1fr`). Collapses to single column < 880px (art panel hidden).
  - **Left pane:** padding 40px 56px; brand mark top-left; form vertically centered, max-width 360px; footer pinned bottom.
  - **Right pane:** brand panel, `linear-gradient(155deg, #277E69, #1F6F5F 48%, #103A33)`, white text, decorative blurred radial blobs + faint 56px grid motif, stat row pinned to bottom.
- **Components:**
  - **Brand wordmark:** "Device" in foreground + "Hub" in `--primary`; 30px rounded-9px primary glyph with `hard-drive` icon.
  - **Google button:** full-width, 46px tall, `--card` bg, 1px `--border`, official 4-color Google "G" SVG (18px), label "Continue with Google". Hover → `--accent` bg. Focus ring = 3px `--ring` @ 35%.
  - **Managed-access note:** `--secondary` bg, rounded, `shield-check` icon, text "Access is limited to IT-managed accounts."
  - **Legal line:** 12px `--muted-foreground`, link in `--primary`.
  - **Art panel:** eyebrow (uppercase, letter-spacing .14em), 34px/600 headline "Every device, accounted for." ("accounted for." in `#6FCF97`), chips (Laptops/Monitors/Servers/Printers), 3 stats (1,284 · 8 · 98.2%).
- **shadcn:** `Button` (outline for Google), `Card` optional. Mostly custom layout.

### 2. Device list (`Device List.html`)
- **Purpose:** Browse, search and filter the device inventory; entry point to details + create.
- **Layout:** App shell (248px sidebar + main). Toolbar row (filters left, "Columns" right), result-count line, then the data view.
- **Two view modes** (toggle via the floating "View" switcher in the mock — in production this is a segmented `ToggleGroup`):
  - **Comfortable (default):** `Table`, 56px rows.
  - **Cards:** responsive grid, `minmax(280px, 1fr)`, 16px gap; each card = **cover photo banner** (with status badge overlaid) + name, code, dept/group/location meta grid, **flag chips** (if any), condition bar + qty footer; whole card links to details, hover lifts border to `--ring`.
- **Table columns:** checkbox · Type icon (group glyph) · Code (mono, muted) · Name (links to details) · Group (`secondary` badge) · Department · Manufacturer/Model (model on 2nd line) · Condition (bar + %) · Location · Status (lifecycle badge) · **Flags** (zero+ attention chips) · Qty · row actions (edit/more, appear on row hover).
- **Filters:** Group · Department · **Status** (lifecycle: in-use/in-storage/in-repair/retired) · **Flag** (warranty-expiring / inventory-overdue) · Manufacturer · search. A dashed "Clear" chip resets all.
- **Columns button (working):** opens a dropdown of checkboxes to **toggle column visibility**; choices persist to `localStorage("dh-cols")`. **Name** is locked ("Required") and can't be hidden. Implement as a shadcn `DropdownMenu` with `DropdownMenuCheckboxItem`s driving a TanStack Table column-visibility state.
- **Cover photo — cards only.** A device's cover (first photo in its gallery) is the **banner at the top of each card**; it is intentionally NOT in the table or the detail/edit header (too small to read — those use the group icon as a type indicator). Card banner falls back to the group icon when a device has no photo. The table's first column is a small **group/type icon**, not a photo.
- **Condition bar:** 56×6px track (`--muted`), fill colored by value — ≥70 green (`--green-500`), 40–69 amber (`oklch(0.78 0.13 75)`), <40 `--destructive`.
- **URL filters:** the list reads `?group=`, `?dept=`, `?status=`, `?mfr=`, `?flag=` on load and pre-applies them (used by the catalog pages). Implement as query-param → table-filter state.
- **shadcn:** `Table`, `Select`, `Input`, `Badge`, `Button`, `Checkbox`, `ToggleGroup`, `Card` (cards view), `DropdownMenu` (row actions).

### 3. Device details (`Device Details.html`)
- **Purpose:** Full record for one device.
- **Layout:** Back link → header (54px group icon, name, code, group badge, derived-status badge, action buttons right: Print label / more / **Edit device**). Body = 2-column grid `1fr 320px`, collapses < 1080px.
  - **Left (main):** stacked `Card`s — Identification, Specifications, Allocation, Lifecycle, Warranty, Notes. Each card = uppercase section title with a small primary icon, then a 2-col definition list (`key` 12px muted / `value` 14px/500; mono for codes).
  - **Right rail:** Condition card (SVG donut ring colored like the bars, 84px), a stat list card (warranty days left, next inventory due, location, department), and a "Recent activity" timeline card (24px dots + connecting line).
- **shadcn:** `Card`, `Badge`, `Button`, `Separator`, `Avatar`. Ring + timeline are custom SVG/CSS.

### 4. Create device (`Create Device.html`)
- **Purpose:** Register a new device.
- **Layout:** Back link → 2-column `220px 1fr`. Left = sticky section nav (numbered, scrollspy). Right = stacked section `Card`s + a bottom action bar (Cancel / Save as draft / **Create device**).
- **Sections:** General (name*, code*, group*, department*) · Classification (manufacturer, model, serial, unit segmented, quantity, specs textarea) · Lifecycle (source, import date, condition slider 0–100, storage position, last-check date, inventory cycle) · Warranty (start, end) · **Photos & documents** (device-photo dropzone + documents dropzone) · Notes (textarea).
- **Controls:** `Input`, `Select`, `Textarea`, segmented control (`ToggleGroup`) for Unit, range `Slider` for Condition, **file dropzones** (see "Uploads" below). Required fields marked with a `--destructive` asterisk.
- **shadcn:** `Card`, `Input`, `Label`, `Select`, `Textarea`, `ToggleGroup`, `Slider`, `Button`, `Form` (use react-hook-form + zod for validation).

### 4b. Edit device (`Edit Device.html`)
- **Purpose:** Modify an existing device. Reached from the details page's "Edit device" button and the list row's edit pencil.
- **Layout:** Same single-page sectioned form as Create, but **prefilled** with the device's current values (selects pre-selected, segmented control set, condition slider positioned, dates filled). Header shows "Edit {device name}" + code with the group icon.
- **Differences from Create:** action bar has a left-aligned **Delete device** (`destructive`) button + Cancel / **Save changes** on the right. The Photos & documents section shows the **existing** photo (filled state, Replace/Remove) and a prefilled document list (e.g. invoice, warranty card, spec sheet) each removable.
- **shadcn:** same as Create + `AlertDialog` for the delete confirmation.

### Uploads (Photos & documents) — used by Create + Edit
- **Device photos (multiple):** a **gallery** — a `.photogrid` of 96px square thumbnails plus a dashed **"Add photo"** tile. Supports selecting/dropping **multiple** images at once; each thumbnail has a hover **remove (×)** button and is **drag-reorderable** (HTML5 drag — grab a thumbnail and drop it elsewhere in the grid). The **first photo is the cover** (green "Cover" badge), so reordering to first = set as cover; the badge auto-reassigns on remove/reorder. Hint: "First photo is the cover · drag & drop or click · PNG or JPG, up to 5 MB each."
- **Documents:** a dropzone ("Upload documents · Invoices, warranty cards, manuals · PDF, DOCX, XLSX, images") above a **file list**. Each item = 34px type-icon tile (icon chosen by extension — `file-text`/`file-spreadsheet`/`file-image`/…), filename, size, and a remove (×) button. Multiple files; drag-drop supported.
- **Implementation:** reference `theme/uploads.js`. In production wire to your asset/object store (presigned upload), store an **ordered array of photo URLs** (index 0 = cover) + a documents array on the device record; validate type + size (5 MB/photo), show progress, allow drag-reorder of photos to change the cover. The mock previews images via `URL.createObjectURL`.

### 5–7. Catalog pages (`Departments.html`, `Groups.html`, `Manufacturers.html`)
- **Purpose:** Manage the lookup tables devices reference.
- **Layout:** App shell + topbar (search + Export + "Add …"). A meta line ("8 groups · 12 devices catalogued") then a single `Table`.
- **Columns:** Name (Groups prefixes a 34px icon tile) · extra columns per type (Departments: Manager, Primary location · Groups: Default inventory cycle · Manufacturers: Support contact, mono) · **Devices** (count + mini bar) · row actions.
- **Device count is a link** → `Device List.html?dept=…` / `?group=…` / `?mfr=…`. Hover reveals a sliding arrow. This is the cross-navigation hook into screen #2's URL filters.
- **Add / edit dialog:** the "Add …" button and each row's edit pencil open a **modal `Dialog`** (overlay + centered card, Esc / overlay-click / Cancel to dismiss). Fields per type — Departments: Name*, Manager, Primary location · Groups: Name*, Icon (picker), Default inventory cycle (number + "months") · Manufacturers: Name*, Support contact (mono). Save validates a non-empty Name, then adds (sorted) or updates in place. The delete (trash) action is **blocked while devices are still assigned** to that value.
- **shadcn:** `Table`, `Input`, `Button`, `Badge`, `Dialog`, `Select`, `Label`. Wire the form with react-hook-form + zod; persist via your catalog CRUD API.

## Shared app shell
- **Sidebar (248px):** brand mark; nav groups — main (Overview, Devices) , Catalog (Departments, Groups, Manufacturers), System (Members, Settings); user chip pinned bottom. Active item = `--sidebar-accent` bg + accent-foreground text. Sidebar bg = `--sidebar` (green-50 in light).
- **Topbar (sticky, blurred):** page title (20px/600) + crumb subtitle, right-aligned actions + a light/dark theme toggle. Backdrop-blur 8px over 86%-opacity background.
- **Theme toggle:** flips `.dark` on `<html>`, persisted to `localStorage("dh-theme")`.
- **Content:** max-width 1320px, 28px padding.

## Interactions & behavior
- **Navigation:** sidebar links route between pages; device name/card → details; "Add device" → create; catalog counts → filtered list.
- **Filtering:** instant client-side on the list (search + 4 selects); "Clear" resets all. Query params hydrate filters on load.
- **View toggle:** segmented control swaps table ↔ cards.
- **Create form:** sticky section nav scrollspy; condition slider shows live %; required-field validation (port to zod).
- **Hover states:** table rows → `--muted` bg + reveal row actions; cards → border to `--ring`; count links → `--accent` bg + sliding arrow; buttons → see token notes.
- **Transitions:** color/border only, ~120–150ms ease. No transforms, no springs (matches the design language).
- **Responsive:** sidebar hides < 980px; details collapses to 1 col < 1080px; create form nav hides < 1000px; login art hides < 880px.

## Status, condition & flags — three separate concepts (don't conflate)
A device's state is split into three independent things. Keeping them apart is deliberate — the old
single "status" forced unrelated facts into one badge and hid information.

1. **Status — lifecycle state (STORED, mutually exclusive).** Exactly one at a time, set by admins:
   `in-use` · `in-storage` · `in-repair` · `retired`. This is the single Status badge.
2. **Condition — its own column.** The 0–100% bar. (There is no "faulty" status — low condition is
   just a low bar; a broken unit being serviced is `in-repair`.)
3. **Flags — attention indicators (DERIVED, independent, can stack).** Zero or more small icon chips,
   computed from dates, never stored:
   - `warranty-expiring` — warranty ends within 90 days (and not already expired)
   - `inventory-overdue` — last check older than the inventory cycle
   An `in-use` device can carry both flags at once without hiding its status. Flags are also filter
   facets ("show everything with an expiring warranty"). See `deriveFlags()` in `types.ts` and the
   `device_with_flags` view in `schema.sql`.

## Data model
The relational schema is the source of truth — see **`schema.sql`** (PostgreSQL DDL: tables,
enums (incl. a stored `device_status` lifecycle enum), FKs, constraints, indexes, and a
`device_with_flags` view that derives the warranty/inventory flags at read time). **`types.ts`**
mirrors it for the app layer: TypeScript row types, Zod schemas for the Create/Edit device + catalog
forms (wire into shadcn `<Form>` via `zodResolver`), a `deriveFlags()` helper matching the SQL view,
and `STATUS_TONE` / `FLAG_META` maps to the theme's classes.

Entities: **device** (core) → N:1 **department**, **device_group**, **manufacturer**; 1:N
**device_photo** (ordered, `sort_order` 0 = cover) and **device_document**. Soft delete via
`deleted_at`; soft retire via `is_retired`. Catalog device counts are `COUNT(*)` grouped by FK
(active rows only).

## State management
- **List:** filter state `{ group, dept, status, mfr, q }` + view mode. Hydrate from URL query params. (Server-side filtering/pagination if the dataset grows.)
- **Details:** fetch one device by code/id; derive status, warranty countdown, condition tone client-side.
- **Create:** form state (react-hook-form), zod schema, POST on submit. Code can be auto-suggested from the chosen group.
- **Catalogs:** CRUD on lookup tables; device counts are aggregates (`GROUP BY` the field).

## Design tokens
**Source palette (colorhunt):** `#EEEEEE` `#6FCF97` `#2FA084` `#1F6F5F`.

These drive the **light** theme; dark mode is a separately tuned deep-pine palette (mint `#6FCF97`
becomes the primary fill with dark text — never a dark fill with white text). Full values live in
**`theme/tokens.css`** as OKLCH. Highlights:

| Role | Light | Dark |
|---|---|---|
| `--background` | #FCFDFC | #121A18 |
| `--foreground` | #16201D | #E8F0ED |
| `--card` | #FFFFFF | #18221F |
| `--primary` | #2FA084 | #6FCF97 |
| `--primary-foreground` | #FCFDFC | #121A18 |
| `--secondary` | #DCF5E8 | #243430 |
| `--muted` / `--muted-foreground` | #F2F4F3 / #5B6B65 | #1F2B28 / #9BB0A9 |
| `--accent` | #DCF5E8 | #2A3D37 |
| `--border` / `--input` | #E4E8E6 | #2C3A36 |
| `--ring` | #2FA084 | #36AE88 |
| `--destructive` | oklch(0.577 0.245 27.3) | oklch(0.704 0.191 22.2) |
| `--sidebar` | #F1FBF6 (green-50) | #18221F |

**Brand ramp:** green-50 #F1FBF6 · 100 #DCF5E8 · 200 #B9EBCF · **300 #6FCF97** · 400 #46BC8A · 500 #36AE88 · **600 #2FA084** · 700 #277E69 · **800 #1F6F5F** · 900 #1A5A4D · 950 #103A33. (Palette colors are the bold stops.)

**Contrast note:** `#2FA084` on white = 3.24:1 (AA-large only) — fine for button fills. If you need
strict 4.5:1 for text-on-fill, switch `--primary` to green-800 `#1F6F5F` (6:1); it's already in the ramp.

**Typography:** Geist (sans) + Geist Mono. Sizes 12/13/14/16/18/22/28. Weights 400/500/600. Mono for codes/serials.
**Radius:** `--radius: 0.625rem` (10px); sub-scale sm/md/lg/xl via `calc`. Cards use `--radius-xl` (14px).
**Spacing:** 4/6/8/10/12/16/18/20/24/28px.
**Shadows:** cards `0 1px 2px rgba(16,24,40,.04)`; popovers `0 8px 30px rgba(16,24,40,.16)`.
**Status badge tones:** success/info/warning/danger/muted — see `.badge-*` in `theme/components.css` for the exact light+dark backgrounds (they shift per mode).

## Assets
- **Icons:** lucide (CDN in mocks → `lucide-react` in app). Names used include: `hard-drive, laptop, monitor, printer, network, server, smartphone, webcam, building-2, layers, factory, layout-dashboard, users, settings, search, plus, download, pencil, ellipsis, arrow-left, arrow-right, shield-check, calendar-clock, map-pin, gauge, history, fingerprint, cpu, activity, sticky-note, clipboard-check, check, sliders-horizontal, chevron-left/right, sun, moon`.
- **Google "G":** inline 4-color SVG in `Login.html` (reuse or swap for your auth lib's button).
- No raster images required. (The design system ships a login cover photo if you want one — optional.)

## Screenshots (`screenshots/`)
Visual targets — recreate these faithfully. Captured at hi-res; light + dark where relevant.

| File | Shows |
|---|---|
| `01-app-shell-desktop.png` | **Full desktop layout** — green sidebar (nav groups + user chip) + topbar + device table. The canonical shell. |
| `02-device-list-comfortable-light.png` | Device list, comfortable table, light. Filters, status badges, condition bars, row hover actions. |
| `03-device-list-cards-light.png` | Device list, **cards** view, light. Card grid with group icon, status, meta, condition footer. |
| `04-device-list-comfortable-dark.png` | Device list, comfortable table, **dark** mode. |
| `05-device-details-light.png` | Device details — header, identification + specs cards, right rail (condition ring, stats, timeline), light. |
| `06-device-details-dark.png` | Device details, **dark** mode. |
| `07-create-device-light.png` | Create form — section nav + General/Classification cards, light. |
| `08-create-device-lifecycle.png` | Create form scrolled to **Lifecycle** — condition slider, dates, segmented Unit control. |
| `09-departments-light.png` | Departments catalog — manager/location cols + clickable device-count links. |
| `10-groups-dark.png` | Groups catalog, **dark** — icon tiles + inventory-cycle col. |
| `11-manufacturers-light.png` | Manufacturers catalog — support-contact (mono) col. |
| `12-theme-palette-rules.png` | Style guide — source palette + the 4 color rules. |
| `13-theme-tokens.png` | Style guide — green ramp + light/dark semantic token tables. |
| `14-catalog-add-dialog.png` | Catalog **add/edit modal** — name, icon picker, inventory cycle, Create/Cancel. |
| `15-edit-device-light.png` | **Edit device** — prefilled sectioned form, Delete / Save changes action bar. |
| `16-device-photos-documents.png` | **Photos & documents** section — multi-photo gallery (cover badge) + document list + dropzone. |
| `17-columns-menu.png` | Device list **Columns** dropdown — per-column visibility toggles (Name locked; Type icon, Flags, etc). |

> Note: in narrow captures the sidebar may be hidden by the responsive breakpoint (< 980px). `01-app-shell-desktop.png` is the reference for the full sidebar + content layout.

## Files in this bundle
- `schema.sql` — **relational schema** (PostgreSQL DDL + `device_with_flags` view). Source of truth for the data model.
- `types.ts` — TypeScript row types + Zod form schemas + `deriveFlags()` + status/flag meta maps.
- `theme/tokens.css` — **production shadcn theme** (light + dark + ramp + Tailwind v4 mapping). The real artifact.
- `theme/components.css` — vanilla-CSS shadcn simulation used by the mocks (reference only; use real shadcn).
- `theme/shell.css`, `theme/shell.js` — sidebar/topbar shell for the mocks (reference only).
- `theme/catalog.js`, `theme/data.js` — catalog renderer + seed data / status map (data shape is useful).
- `theme/uploads.js` — photo + document dropzone behavior (preview, drag-drop, type icons, remove).
- `Login.html`, `Device List.html`, `Device Details.html`, `Create Device.html`, `Edit Device.html`,
  `Departments.html`, `Groups.html`, `Manufacturers.html` — the screen references.
- `DeviceHub Theme.html` — the living style guide (palette, rules, ramp, token tables, components).

## Suggested build order
1. Apply `tokens.css` + fonts + `shadcn init`.
2. Stand up the database from `schema.sql`; generate types (or use `types.ts`).
3. Build the app shell (sidebar + topbar + theme toggle).
4. Device list (table + filters + URL params + view toggle + column visibility).
5. Device details (+ `deriveFlags`).
6. Create + Edit forms (react-hook-form + Zod from `types.ts`; photo gallery + documents).
7. Catalog pages (+ count → filtered-list links + add/edit dialog).
8. Login.
