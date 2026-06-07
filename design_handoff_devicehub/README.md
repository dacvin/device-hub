# Handoff: DeviceHub — IT device-management portal

## Overview
DeviceHub is an internal IT asset-management web app for Sioux Asia. IT admins register
devices, browse/filter the inventory, inspect a device's full record, and manage the
lookup catalogs (departments, groups, manufacturers). This package contains hi-fi HTML
design references plus a **production-ready shadcn/ui theme** derived from the brand palette.

## About the design files
The HTML files in this bundle are **design references** — prototypes showing the intended
look and behavior. They are NOT meant to be shipped as-is. The task is to **recreate these
screens in the target codebase** (Next.js App Router + Tailwind v4 + shadcn/ui + Supabase)
using its established components and patterns.

**One exception — `theme/tokens.css` IS production code.** It's a drop-in shadcn theme
(see "Design tokens" below). Everything else (`components.css`, `states.*`, `shell.*`, the per-page
HTML/JS) is a vanilla-CSS *simulation* of shadcn so the mocks run standalone in a browser —
do not port that simulation; use the real shadcn components instead.

> **What changed in this revision** (read me): added four screens — **Overview** (dashboard),
> **Members**, **Member profile**, **Settings** — plus **bulk actions**, an **avatar menu**,
> **toasts**, **confirm dialogs**, and a full set of **states** (loading / error / empty /
> first-run / validation / permission-denied / 404 / 500) in `states/`. The data model gains
> **members & access** (`migrations/003_members.sql`) and **settings**
> (`migrations/004_settings.sql`). See the new sections below; everything is light + dark.

## Fidelity
**High-fidelity.** Final colors, typography (Geist), spacing, radii, and interactions are all
settled. Recreate pixel-faithfully using shadcn/ui primitives. Because the mocks already use
shadcn's token names and conventions, most screens map 1:1 onto stock shadcn components.
Use the **screenshots** in `screenshots/` (light + dark) as the visual target for each screen
and state.

## Tech stack (target)
- **Next.js (App Router) + React + Tailwind CSS v4 + shadcn/ui.**
- **Supabase** — Postgres + Auth + Row-Level Security + Storage (device photos/documents).
  The SQL in this bundle (`schema.sql`, `seed.sql`, `migrations/*`) is PostgreSQL and runs
  on Supabase as-is. Generate types with `supabase gen types typescript`; `types.ts` here is
  the hand-written mirror you can check against.
- **Geist** + **Geist Mono** fonts. **lucide-react** for icons (mock names are identical).
- **Data access:** Supabase JS client (`@supabase/supabase-js` + `@supabase/ssr` for App Router).
  Per-screen query shapes are in **"API / query contract"** below.
- **Auth & gating:** Google SSO via Supabase Auth (Workspace-gated to `@sioux.asia`); role
  enforcement via **RLS policies** keyed off the `member` row — see **"Role-gating"**.
- If starting fresh: `npx create-next-app`, `npx shadcn@latest init`, `supabase init`.

## How to apply the theme (start here)
1. Run `npx shadcn@latest init` (CSS variables, base color = neutral — you'll overwrite it).
2. Replace the generated `:root` / `.dark` blocks in `globals.css` with the blocks from
   **`theme/tokens.css`** — it defines every shadcn role (`--background`, `--primary`, `--card`,
   `--ring`, `--sidebar-*`, `--chart-*`, …) in both modes plus the brand ramp (`--green-50`…`950`).
3. Keep the file's `@theme inline { … }` block — it's the Tailwind v4 token mapping.
4. `shadcn add` the components listed per screen and you're skinned.

## Screens / Views

> **Acceptance checklist** — a screen is "done" only when every box is true. Use this to verify
> behavior, not just looks. (Visual fidelity is covered by the screenshots; this covers function.)
>
> **Global / shell**
> - [ ] Sidebar active item reflects the route; collapses < 980px (drawer on mobile).
> - [ ] Theme toggle flips light/dark and persists across reloads (`localStorage("dh-theme")`).
> - [ ] Avatar menu opens (profile / settings / theme / sign out), closes on outside-click + Esc.
> - [ ] Every destructive action routes through a confirm dialog and ends in a toast.
> - [ ] All dialogs/menus are keyboard-operable (focus trap, Esc) and screen-reader labelled.
>
> **Overview**
> - [ ] KPIs compute from live data; "Needs attention" counts devices with ≥1 derived flag and uses the alert treatment when > 0.
> - [ ] Lifecycle bar segments = status share of total; legend rows link to the status-filtered list.
> - [ ] Group bars = each group's share of the **whole fleet** (not vs largest); rows link to the group-filtered list.
> - [ ] Recent activity reads newest-first from the `activity` table.
>
> **Device list**
> - [ ] Search + group/dept/status/flag/manufacturer filters work and combine; "Clear" resets; filters hydrate from URL query params.
> - [ ] Table ↔ Cards toggle; column visibility persists; **Name** can't be hidden.
> - [ ] Row select + header tri-state (checked/indeterminate); bulk bar appears with Status / Export / Delete; **delete confirms then toasts**.
> - [ ] Flags are derived (warranty window from settings), never stored; condition bar color follows the threshold settings.
> - [ ] Filtered-empty vs first-run-empty states both render; loading skeleton + error+retry exist.
>
> **Device details / Create / Edit**
> - [ ] Details derives flags + warranty countdown; Edit prefills; Delete confirms.
> - [ ] Create/Edit validate via the Zod schemas (required, code pattern+uniqueness, warranty start≤end, ranges); errors show inline + summary banner.
> - [ ] Photos are an ordered gallery (index 0 = cover, drag-reorder); docs list; both → Storage.
> - [ ] Code auto-suggests from group using `org_settings.code_prefix` when auto-generate is on.
>
> **Catalogs**
> - [ ] Add/edit dialog validates a unique non-empty name; device-count links open the filtered list; delete blocked while devices reference the row.
>
> **Members / Member profile**
> - [ ] Role-summary counts; segmented role filter + search; row → profile.
> - [ ] Select + bulk Role / Export / Remove (**remove confirms then toasts**); invite dialog validates `@sioux.asia` + role + dept and toasts.
> - [ ] Profile permissions card matches the role's `CAPABILITIES`; "devices managed" derives by department; Viewers show read-only.
>
> **Settings**
> - [ ] Admin-only (Viewer/Manager → permission-denied state); save toasts; **purge confirms then toasts**.
> - [ ] Theme segment drives the live theme; write-time vs read-time vs job-config settings behave per "Settings → data model" (e.g. changing code prefix affects only new devices; changing condition thresholds / warranty window re-renders with no backfill).
>
> **Auth / errors**
> - [ ] Google SSO gated to `@sioux.asia`; role loaded from `member`; RLS enforces access server-side.
> - [ ] 404 and 500 pages render; loading/error/empty states exist on every data screen.

### 1. Login (`Login.html`)
- **Purpose:** Authenticate via Google SSO (Workspace-gated, no password).
- **Layout:** Full-viewport 2-column grid (`1fr 1fr`). Collapses to single column < 880px (art panel hidden).
  - **Left pane:** padding 40px 56px; brand mark top-left; form vertically centered, max-width 360px; footer pinned bottom.
  - **Right pane:** brand panel, `linear-gradient(155deg, #277E69, #1F6F5F 48%, #103A33)`, white text, decorative blurred radial blobs + faint 56px grid motif, stat row pinned to bottom.
- **Components:**
  - **Brand wordmark:** "Device" in foreground + "Hub" in `--primary`; 30px rounded-9px primary glyph with `hard-drive` icon.
  - **Google button:** full-width, 46px tall, `--card` bg, 1px `--border`, official 4-color Google "G" SVG (18px), label "Continue with Google". Hover → `--accent` bg. Focus ring = 3px `--ring` @ 35%.
  - **Managed-access note:** `--secondary` bg, rounded, `shield-check` icon, text "Access is limited to IT-managed @sioux.asia accounts."
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

### 8. Overview / dashboard (`Overview.html`)
- **Purpose:** The landing page. A read-only summary of fleet health, computed entirely from the device rows + settings thresholds. Every tile deep-links into a filtered Device list.
- **Layout:** App shell. A 4-up **KPI row**, then a 2-column grid `1fr 340px`: left column = "Lifecycle status" + "Inventory by group" cards; right rail = "Needs attention" + "Recent activity". Collapses to 1 column < 1080px; KPI row → 2-up.
- **Visual explainers (what each element means — implement exactly):**
  - **KPI cards (4):** `Total devices` (= `COUNT(*)`; subtitle sums `quantity` and counts distinct departments), `In use` (count where `status='in-use'`; subtitle = storage + retired counts), `Needs attention` (count of devices with ≥1 derived flag — this card uses the amber `alert` icon treatment when > 0), `In repair` (count where `status='in-repair'`; subtitle = fleet-wide average `condition`). Numbers are 30px/600 tabular-nums.
  - **Lifecycle status bar:** a single horizontal **stacked bar**, 12px tall, fully rounded. Each segment's **width = that status's share of total devices** (`count(status)/total`), colored: in-use = `--green-500`, storage = blue `oklch(0.70 0.10 230)`, repair = amber `oklch(0.78 0.13 75)`, retired = `--muted-foreground`. Below it a 2-col **legend**: swatch · status label · count · right-aligned **percentage**. Each legend row links to `Device List.html?status=<key>`. Meaning: "what proportion of the fleet is in each lifecycle state; every device is in exactly one."
  - **Inventory by group bars:** one row per group, sorted by count desc. Grid `116px 1fr auto`: group name (with its lucide icon tile) · a **track+fill bar** · count + percentage. **The fill width = that group's share of the *whole fleet*** (`count(group)/total`), NOT relative to the largest group — the subtitle reads "Share of all N devices". So Laptop 3-of-12 fills 25%. Meaning: "how the inventory is distributed across groups." Whole row links to `Device List.html?group=<name>`.
  - **Needs attention rail:** the list of devices with ≥1 derived flag (see "Status, condition & flags"). Each row = group icon · name + code · **compact icon-only flag chips** (label hidden in this narrow rail; full label on hover `title`). Row links to that device's details. Empty → "No devices need attention right now."
  - **Recent activity:** a timeline (dot + connector). In the mock this is illustrative copy; **in production feed it from the `activity` table** (`migrations/005_activity.sql`) — newest 5, workspace-wide, with the actor's name. See "Activity log" below; row icon/phrasing come from `ACTIVITY_META` in `types.ts`.ative timestamps).
- **Interactions:** everything is a link (no mutations on this page). Hover on legend rows / group rows / attention rows → `--muted` bg. KPI cards are static.
- **Query (Supabase):** one read of the active devices (`select * from device where deleted_at is null`) → compute KPIs, status shares, group shares, and `deriveFlags(d, {warrantyWindowDays: settings.warranty_expiring_days})` client-side; OR push counts down as SQL aggregates (`select status, count(*) … group by status`). Read `org_settings` once for the warranty window.
- **shadcn:** `Card`, `Badge`, `Progress` (or a custom stacked bar), `Separator`. Charts are simple CSS bars — no chart lib needed.

### 9. Members (`Members.html`)
- **Purpose:** Manage who has access to DeviceHub and their role. HR/admin screen.
- **Layout:** App shell + topbar (search · Export · **Invite member**). A 3-up **role-summary card row**, a **segmented role filter** (All / Admins / Managers / Viewers), a meta line, then a `Table`.
- **Visual explainers:**
  - **Role-summary cards (3):** count of members per role + the role's one-line capability summary. Icons: `shield-check` (IT Admin), `user-cog` (Manager), `eye` (Viewer).
  - **Table columns:** select checkbox · **Member** (avatar initials on solid primary + name + email; "You" pill on the current user) · **Role** (badge with role icon — primary/secondary/muted tone) · Department · **Devices managed** (count; "—" for Viewers, who manage none) · Last active · **Status** (`Active` success badge / `Invited` warning badge) · row actions (View profile arrow + more, on hover).
  - **Member row → Member profile** (`Member Profile.html?email=…`). Avatar+name and the arrow action both navigate.
- **Interactions:**
  - **Search** filters by name/email/department (instant, client-side in mock; server `ilike` in prod).
  - **Segmented filter** narrows by role.
  - **Selection + bulk bar:** checking rows (or the header "select all", which shows checked/indeterminate) reveals the floating **bulk bar** with: **Role** (popover → reassign role on selection), **Export**, **Remove** (→ confirm dialog → toast). Selected rows get a primary tint.
  - **Invite member** opens the **Invite dialog** (work email, role, department → Send invite → success toast). See screenshot 43.
- **Query (Supabase):** `select id,name,email,role,status,department:department_id(name), last_active_at from member order by name`. "Devices managed" count = `select count(*) from device where department_id = member.department_id and deleted_at is null` (managers/admins only). Mutations: invite = insert `member(status='invited')` + auth invite; role change = `update member set role=…`; remove = delete (or set `status='disabled'`).
- **shadcn:** `Table`, `Checkbox`, `Badge`, `Avatar`, `Input`, `ToggleGroup` (segmented), `DropdownMenu` (bulk popovers + row more), `Dialog` (invite), `Button`, **Sonner** (toasts), `AlertDialog` (remove confirm).

### 10. Member profile (`Member Profile.html?email=…`)
- **Purpose:** One member's full record. Reached from a Members row and from the avatar menu's "View profile".
- **Layout:** Back link → header (56px avatar, name + "You", email, role badge, status badge; right actions Message / more / **Edit member**). Body = 2-column `1fr 320px`: left = Details + **Devices managed** + **Permissions**; right rail = managed-count card, a stat list (role/department/site/member-since), and a recent-activity timeline. Collapses to 1 col < 1080px.
- **Visual explainers:**
  - **Details** = definition-list grid (role, department, site, status, phone (mono), reports-to, member-since, last-active).
  - **Devices managed:** the devices in this member's department (derived by `department_id`, NOT a stored assignment). Lists up to 6 with a "View all in <dept> →" link to the filtered list. **Viewers** show a read-only note instead (they manage none).
  - **Permissions card:** renders the **capability matrix** for the member's role — each capability row is green-check (allowed) or muted-dash (denied). This is DERIVED from role, never stored. The matrix is the single source of truth in `types.ts → CAPABILITIES` and is mirrored by Supabase RLS (see "Role-gating").
- **Interactions:** links only (devices, view-all). Edit/Message are stubs in the mock; wire to the member update form + mailto/Slack.
- **Query (Supabase):** `select *, department:department_id(name), reports_to:reports_to(name) from member where email=:email`; managed devices as in screen 9.
- **shadcn:** `Card`, `Badge`, `Avatar`, `Button`, `Separator`.

### 11. Settings (`Settings.html`)
- **Purpose:** Configure the workspace (org-wide) + personal display prefs. **Admin-gated** (Viewers/Managers see the permission-denied state — see `states/Permission denied (Viewer).html`).
- **Layout:** 2-column `220px 1fr`: left = **sticky section nav** with scrollspy; right = stacked section `Card`s + a fixed bottom **save bar**. Collapses to 1 col < 1000px (nav hides).
- **Sections & the meaning of each control** (this is where settings change how data behaves — see "Settings → data model" below):
  - **General:** org name, primary site (write-time default location for new devices), date format.
  - **Appearance** (per-user): **Theme** segmented (Light/Dark/System — drives the live theme + persists), default device view (table/cards), mono codes toggle.
  - **Inventory defaults** (WRITE-TIME — applied only at device create): auto-generate code toggle, **code prefix** (e.g. `DEV-`), default inventory cycle (months). Changing these affects **new** devices only; existing `device.code` is never rewritten.
  - **Notifications** (job config + one read-time value): warranty-expiring toggle **and its "days before" number** (this number is the warranty-flag window — read-time, re-flags instantly with no backfill), inventory-overdue toggle, weekly summary, new-device alert.
  - **Data & export:** default export format, retain-deleted days, "Export full inventory" action.
  - **Condition thresholds** (READ-TIME — display only): the good/fair % cutoffs that color the condition bars; changing them recolors every bar without touching data.
  - **Danger zone:** **Purge retired devices** → destructive **confirm dialog** → toast.
- **Interactions:** switches toggle; theme segment flips `.dark` live + persists to `localStorage("dh-theme")`; section nav smooth-scrolls + scrollspy-highlights; **Save** → success toast; **Purge** → confirm → toast.
- **Query (Supabase):** read the singleton `org_settings` (one row) + `user_preference` for the current user on load; **Save** = `update org_settings set … , updated_by=:me, updated_at=now()`; theme/view = upsert `user_preference`. See "Settings → data model" for which bucket each control falls in.
- **shadcn:** `Card`, `Switch`, `Select`, `Input`, `ToggleGroup` (theme), `Button`, `AlertDialog` (purge), **Sonner**. Wire forms with react-hook-form; the save bar reflects dirty state.

## Shared app shell
- **Sidebar (248px):** brand mark; nav groups — main (Overview, Devices) , Catalog (Departments, Groups, Manufacturers), System (Members, Settings); user chip pinned bottom. Active item = `--sidebar-accent` bg + accent-foreground text. Sidebar bg = `--sidebar` (green-50 in light).
- **Topbar (sticky, blurred):** page title (20px/600) + crumb subtitle, right-aligned actions + a light/dark theme toggle. Backdrop-blur 8px over 86%-opacity background.
- **Theme toggle:** flips `.dark` on `<html>`, persisted to `localStorage("dh-theme")`.
- **Avatar menu (user chip):** clicking the bottom-left user chip opens a popover anchored above it: profile header (name + email), **View profile** (→ `Member Profile.html?email=…`), **Account settings** (→ Settings), **Light/Dark mode** toggle, and **Sign out** (→ Login). Closes on outside-click / Esc. Implement as a shadcn `DropdownMenu`. See screenshot 46.
- **Content:** max-width 1320px, 28px padding.

## Interactions & behavior
- **Navigation:** sidebar links route between pages; device name/card → details; "Add device" → create; catalog counts → filtered list.
- **Filtering:** instant client-side on the list (search + 4 selects); "Clear" resets all. Query params hydrate filters on load.
- **View toggle:** segmented control swaps table ↔ cards.
- **Create form:** sticky section nav scrollspy; condition slider shows live %; required-field validation (port to zod).
- **Hover states:** table rows → `--muted` bg + reveal row actions; cards → border to `--ring`; count links → `--accent` bg + sliding arrow; buttons → see token notes.
- **Transitions:** color/border only, ~120–150ms ease. No transforms, no springs (matches the Sioux design language).
- **Responsive:** sidebar hides < 980px; details collapses to 1 col < 1080px; create form nav hides < 1000px; login art hides < 880px. See **"Responsive & mobile"** below for the full breakpoint map (the brand is responsive desktop + mobile; there is no native app).
- **Bulk selection (Device list + Members):** row checkboxes + a header select-all (checked / indeterminate). Any selection reveals a floating, pill-shaped **bulk bar** (centered, bottom) with contextual actions; selected rows get a primary tint. Clearing or acting hides it. Destructive bulk actions route through a confirm dialog; all bulk actions end in a toast. See **"Toasts & confirmations"**.

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

## States (`states/`)
Each state is a standalone HTML file (uses `<base href="../">` to reuse the root theme). The
reusable patterns live in `theme/states.css` + `theme/states.js` (skeleton builders, error /
empty / permission blocks, toast, confirm) — in production use shadcn **Skeleton**, **Sonner**,
**AlertDialog**, and your empty-state component instead of porting that sim.

| State | File(s) | When it shows | Build note |
|---|---|---|---|
| **Loading** | `… — Loading.html` (Overview, Device List, Members, Member Profile) | While the query is in flight | Skeleton that mirrors the final layout (KPI tiles, table rows, role cards, profile cards). Use shadcn `Skeleton`; gate on `isLoading`. |
| **Error** | `Device List — Error.html` | Query failed / network error | Centered card: icon, title, description, **Try again** (refetch), and a mono error-code/request-id line. Pattern applies to every data screen. |
| **Empty / first-run** | `… — Empty (first run).html` (Device List, Members, Overview) | No rows yet (fresh workspace) | Friendly icon + title + 1–2 primary actions (Add device / Invite / Set up catalogs). Distinct from the **filtered-empty** state already built into Device List + Members ("No … match these filters" with Clear). |
| **Validation errors** | `Create Device — Validation errors.html` | Submit with invalid/missing fields | Red form banner ("N fields need your attention") + per-field `.field.invalid` (red border + halo) + inline `.field-error` messages. See "Form validation". |
| **Permission denied** | `Permission denied (Viewer).html` | A Viewer/Manager opens an admin-only route (e.g. Settings) | Lock icon, role explanation, Back + Request-access. Enforce server-side via RLS — this is the friendly client fallback. |
| **404 / 500** | `404 Not found.html`, `500 Server error.html` | Bad route / server error | Full-viewport branded page (DeviceHub mark, big numeral, copy, actions). 500 has a request-id + reload. |

**Two kinds of "empty" — don't merge them:** *first-run* (no data exists → onboarding actions)
vs *filtered-empty* (data exists but filters exclude everything → "Clear filters"). The live
Device List/Members already render filtered-empty; the `states/` files cover first-run.

## Toasts & confirmations
- **Toasts** (`DH.toast` in the mock → **Sonner** in prod): bottom-right, auto-dismiss ~4s,
  types `success | error | info` (icon + tone per type), title + optional description, manual
  close. Fired after every create/update/delete/invite/export/role-change. Copy is concise and
  factual ("Invitation sent", "2 devices deleted", "Settings saved"). See screenshot 49.
- **Confirm dialogs** (`DH.confirm` → shadcn **AlertDialog**): required before any destructive
  or irreversible action — **bulk delete devices**, **remove members**, **purge retired**. Icon
  + title (states the count/scope) + description (states the consequence + recoverability) +
  Cancel / destructive-confirm. Esc / overlay-click / Cancel dismiss; confirm runs the action
  then toasts. `tone:"warn"` swaps the red confirm button for primary on non-deletes. See
  screenshots 44/45/50.
- **Where wired (live in the mocks):** Device list bulk Status→toast, Export→toast,
  Delete→confirm+toast; Members bulk Role→toast, Remove→confirm+toast, Invite→toast;
  Settings Save→toast, Purge→confirm+toast.

## Role-gating & permissions (+ Supabase RLS)
Roles: **IT Admin / Manager / Viewer** (`member.role`, stored as enum `it_admin|manager|viewer`).
Permissions are **derived from role, never stored per-user** — the single source of truth is the
capability matrix in `types.ts → CAPABILITIES` (and `migrations/003_members.sql` documents it).

| Capability | IT Admin | Manager | Viewer |
|---|:--:|:--:|:--:|
| View inventory | ✓ | ✓ | ✓ |
| Manage devices in **own dept** | ✓ | ✓ | — |
| Manage **all** devices | ✓ | — | — |
| Manage catalogs (dept/group/mfr) | ✓ | — | — |
| Export data | ✓ | ✓ | — |
| Manage members | ✓ | — | — |
| Change workspace settings | ✓ | — | — |

**What the UI does per role (enforce in UI *and* server):**
- **Viewer:** read-only everywhere. Hide bulk-action bars, row edit/delete, "Add device", catalog
  add/edit, invite, and Settings writes. Opening Settings → the permission-denied state.
- **Manager:** same as Viewer plus create/edit/delete devices **and** bulk actions **scoped to
  their own `department_id`**; can export. No catalogs, members, or settings.
- **IT Admin:** everything.

**Enforce with Supabase RLS** (UI gating is convenience, not security). Sketch:
```sql
-- helper: current member row
create function app_role() returns member_role language sql stable as $$
  select role from member where email = auth.jwt()->>'email' $$;
create function app_dept() returns uuid language sql stable as $$
  select department_id from member where email = auth.jwt()->>'email' $$;

alter table device enable row level security;
create policy device_read  on device for select using (true);          -- all roles read
create policy device_write on device for all using (                    -- admins all, managers own dept
  app_role() = 'it_admin'
  or (app_role() = 'manager' and department_id = app_dept())
) with check (
  app_role() = 'it_admin'
  or (app_role() = 'manager' and department_id = app_dept())
);
alter table org_settings enable row level security;
create policy settings_admin on org_settings for all using (app_role() = 'it_admin');
-- member / catalog tables: write restricted to it_admin similarly.
```

## Form validation rules
Wire with **react-hook-form + zod**; schemas already exist in `types.ts`
(`deviceFormSchema`, `departmentFormSchema`, `groupFormSchema`, `manufacturerFormSchema`).
Display: per-field red border + halo (`.field.invalid`) + inline message (`.field-error`), and a
summary banner on submit (`.form-banner`). Rules:
- **Device — name:** required, ≤120 chars.
- **Device — code:** required, **unique**, pattern `DEV-####-XXX` (auto-suggested from group when
  auto-generate is on; the suggestion uses `org_settings.code_prefix`). Show "Code must match
  DEV-0000-XXX" / "This code is already in use".
- **Device — group, department, status:** required (selects).
- **Device — condition:** 0–100. **quantity:** integer ≥ 1. **inventory cycle:** 1–120 months.
- **Device — warranty:** `warranty_end >= warranty_start` (cross-field).
- **Invite member — email:** required, valid email, must end `@sioux.asia`; **role**, **department** required.
- **Catalog forms — name:** required, non-empty, unique within its table.
Validate on submit + on blur for touched fields; the create form's section nav can badge sections
that contain errors. See `states/Create Device — Validation errors.html`.

## API / query contract (Supabase)
Thin per-screen contract. Client = `@supabase/supabase-js` (+ `@supabase/ssr` for RSC/route handlers).
RLS (above) enforces access; these are the read/write shapes.

- **Overview:** `from('device').select('*').is('deleted_at', null)` → aggregate client-side, or
  `rpc`/grouped counts. `from('org_settings').select('*').single()` for the warranty window.
- **Device list:** `from('device').select('*, group:group_id(name,icon), department:department_id(name), manufacturer:manufacturer_id(name)').is('deleted_at', null)` then `.eq()` per active filter (`group_id`, `department_id`, `status`, `manufacturer_id`) and `.or('name.ilike.%q%,code.ilike.%q%')` for search. Flags are derived (`deriveFlags`) or read from the `devices_with_flags(p_warranty_days)` function. Paginate with `.range()`.
- **Device details:** `…select(…, photos:device_photo(*), documents:device_document(*)).eq('code', code).single()`.
- **Create / Edit device:** `insert` / `update`; photos+docs to **Supabase Storage**, store ordered URLs (index 0 = cover). Resolve `inventory_cycle_months` at insert: explicit → group default → org default.
- **Catalogs:** CRUD on `department|device_group|manufacturer`; counts via grouped select; block delete while devices reference the row.
- **Members:** `from('member').select('*, department:department_id(name)').order('name')`; invite = `insert` + `auth.admin.inviteUserByEmail`; role/remove = `update`/`delete`.
- **Member profile:** `from('member').select('*, department:department_id(name), reports_to:reports_to(name)').eq('email', email).single()`; managed devices by `department_id`.
- **Settings:** `from('org_settings').select('*').single()` + `from('user_preference').select('*').eq('user_id', me).maybeSingle()`; save = `update org_settings` / `upsert user_preference`.

## Accessibility & keyboard
- **Dialogs / confirms:** `role="dialog"`/`alertdialog`, `aria-modal`, labelled by the title;
  focus moves in on open and is trapped; **Esc** and overlay-click close; focus returns to the
  trigger. (shadcn Dialog/AlertDialog handle this — keep it.)
- **Menus / popovers** (avatar, bulk Role/Status, columns): open on click, close on outside-click
  + Esc; arrow-key navigation; `aria-expanded` on the trigger.
- **Tables:** the header checkbox is a tri-state (checked / unchecked / **indeterminate**) and is
  keyboard-toggleable; row links are real `<a>`; row actions reachable by Tab (not hover-only — in
  prod keep them focus-visible, not purely `opacity:0`).
- **Toasts:** `role="status"` (success/info) / `role="alert"` (error) so they're announced.
- **Focus ring:** 3px `--ring` halo on inputs/controls (already in the theme). Don't remove outlines.
- **Color:** status/role/flag meaning is never color-only — always paired with a label or icon.
- **Hit targets:** ≥ 36px controls; icon buttons 30–36px.
- **Reduced motion:** skeleton shimmer and transitions respect `prefers-reduced-motion`.

## Responsive & mobile
Responsive web (desktop + mobile); **no native app**. There is now a **dedicated mobile design**
for every screen — see **`DeviceHub Mobile.html`** (a gallery of iOS phone frames). It uses the
same DeviceHub tokens/components at 390px with a **bottom tab bar**, and presents **two
navigation options to choose between**:
- **Option A — 4-tab** (Overview · Devices · Members · More) with a floating ＋ on the Devices screen.
- **Option B — 5-tab with a center Add (＋) action** (Overview · Devices · ＋ · Members · More). *Recommended.*
Both route Catalogs + Settings under a **More** tab. Mobile-specific patterns: list-style device
**cards** (the table's mobile mode), filter **chips** (horizontal scroll), sticky bottom **action bar**
on forms (replaces the tab bar), and a centered profile header. Build these as the responsive
breakpoints of the same components — the mobile mock shows the intended end state. Files:
`mobile/mobile.css` (the mobile layer, namespaced `.mob`) + `mobile/mobile-screens.js`.

Underlying breakpoints (the desktop documents also reflow here — verify by narrowing the browser):
- **Sidebar** hides < 980px (provide a hamburger/drawer in prod).
- **Overview:** 2-col grid → 1 col < 1080px; KPI row 4-up → 2-up.
- **Device list:** table is horizontally scrollable on narrow widths; the **Cards** view is the
  mobile-friendly mode. Filters wrap.
- **Members / Member profile:** profile 2-col → 1 col < 1080px; member table scrolls horizontally.
- **Settings:** 2-col → 1 col < 1000px (section nav hides; sections stack).
- **Create/Edit:** section nav hides < 1000px; form fields go single-column.
- **Bulk bar / toasts / dialogs:** already viewport-anchored; keep them within safe-area insets on mobile.

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

**Migrations (run order):** `schema.sql` (base) → `migrations/003_members.sql` →
`migrations/004_settings.sql` → `migrations/005_activity.sql` → `seed.sql` (last; seeds catalogs,
devices, **members**, the **settings** singleton, and one `user_preference`). On Supabase, run them
as numbered migrations.

### Members & access (`migrations/003_members.sql`)
New table **member**: `name`, `email` (unique, `@sioux.asia`), `role` (enum
`it_admin|manager|viewer`), `status` (enum `active|invited|disabled`), `department_id` (FK),
`site`, `phone`, `reports_to` (self-FK), `joined_at`, `last_active_at`, `invited_by`. A
`member_role_label()` SQL fn maps the enum → display label ("IT Admin"…). **`types.ts`** mirrors
this: `Member`, `MemberRole`, `ROLE_LABEL`, plus the `CAPABILITIES` matrix + `can()` helper and
`ROLE_TONE`/`STATUS`-style maps for the badges. **Permissions and "devices managed" are DERIVED,
never stored** (permissions = role function; managed devices = devices in the member's
`department_id`). See "Role-gating".

### Settings → data model (`migrations/004_settings.sql`) — *this is the "settings that change how data works" part*
Settings are **not all the same kind of thing**; the schema keeps them apart on purpose, and
that decides whether changing one touches device rows:
- **org_settings** — a **singleton** row (fixed-PK guard). Holds org config + the three buckets below.
- **user_preference** — per-user (theme, default view, mono codes). `user_id` → `member(id)`.

| Bucket | Examples | Touches device rows? | Rule |
|---|---|---|---|
| **Write-time defaults** | `code_prefix`, `code_autogenerate`, `primary_site`, `default_inventory_cycle_months` | **Only at INSERT** | Materialized onto the new row; changing later affects **new** devices only. `device.code` is a stable id — never rewritten. |
| **Read-time derived** | `condition_good_pct` / `condition_fair_pct`, `warranty_expiring_days` | **No** | Applied at render/derivation; a change instantly recolors bars / re-flags devices with **no backfill**. |
| **Job config** | notify toggles, `export_format`, `deleted_retention_days` | No | Drives schedulers (digest, purge) + export defaults. |

**The one gotcha:** the original `device_with_flags` view hardcoded a 90-day warranty window.
Now that `warranty_expiring_days` is configurable, `004` **replaces the view with a function**
`devices_with_flags(p_warranty_days int)`, and `deriveFlags(d, {warrantyWindowDays})` in
`types.ts` takes the window as an option. Call it with the setting:
`devices_with_flags((select warranty_expiring_days from org_settings))`. Condition thresholds and
the warranty window are therefore **never written onto a device** — pure read-time.

**Inventory-cycle resolution order** (decided at device INSERT, then stored on the row):
explicit device value → else `device_group.default_inventory_cycle_months` → else
`org_settings.default_inventory_cycle_months`.

### Activity log (`migrations/005_activity.sql`)
New table **activity**: `actor_id` (FK member, null = system), `action` (enum, e.g.
`device.status_changed`, `member.invited`, `settings.updated`), `entity_type`, `entity_id`,
`entity_label` (denormalized for display), `metadata` (jsonb, e.g. `{from,to}` for a status
change), `created_at`. Indexed for newest-first reads globally, per-entity, and per-actor.
**`types.ts`** mirrors it: `Activity`, `ActivityAction`, and `ACTIVITY_META` (icon + verb per
action) for rendering the timeline rows. Write one row in the same transaction as each mutation
(or via a `SECURITY DEFINER` `logActivity()` fn). It feeds three timelines: **Overview** (newest 5,
workspace-wide), **Member profile** (this member's actions), and **Device details** (this device's
history). RLS: read for all members, insert via service role only.

## State management
- **List:** filter state `{ group, dept, status, mfr, flag, q }` + view mode + **selection set** (bulk). Hydrate filters from URL query params.
- **Details:** fetch one device by code/id; derive flags, warranty countdown, condition tone client-side (pass the configured warranty window).
- **Create/Edit:** react-hook-form + zod; code auto-suggested from group using `org_settings.code_prefix`.
- **Catalogs:** CRUD on lookup tables; device counts are aggregates (`GROUP BY` the field).
- **Members:** list filter `{ role, q }` + selection set; mutations invalidate the list.
- **Settings:** load `org_settings` + `user_preference`; track dirty state for the save bar; theme also mirrored to `localStorage("dh-theme")` for instant paint.

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
- No raster images required. (The Sioux design system ships a login cover photo if you want one — optional.)

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
| `18-overview-light.png` / `19-overview-dark.png` | **Overview dashboard** — KPI row, lifecycle stacked bar, inventory-by-group share bars, attention rail. Light + dark. |
| `20-members-light.png` / `21-members-dark.png` | **Members** — role-summary cards, segmented role filter, member table (role/status badges). Light + dark. |
| `22-member-profile-light.png` / `23-member-profile-dark.png` | **Member profile** — header, details, role badges. Light + dark. |
| `24-settings-light.png` / `25-settings-dark.png` | **Settings** — sticky section nav, General/Appearance cards, save bar. Light + dark. |
| `26/27-state-loading-list-*.png` | Device list **loading skeleton**, light + dark. |
| `28-state-loading-overview-light.png` | Overview **loading skeleton** (KPI + card skeletons). |
| `29-state-loading-members-light.png` | Members **loading skeleton** (role cards + table). |
| `30-state-loading-profile-light.png` | Member profile **loading skeleton**. |
| `31/32-state-error-*.png` | **Error state** (failed fetch + Try again + request id), light + dark. |
| `33-state-empty-list-light.png` | Device list **first-run empty** (Import / Add device). |
| `34-state-empty-members-light.png` | Members **first-run empty** (Invite). |
| `35-state-empty-overview-light.png` | Overview **first-run empty**. |
| `36/37-state-permission-denied-*.png` | **Permission denied** (Viewer → Settings), light + dark. |
| `38-state-validation-errors-light.png` | Create device **validation errors** — banner + invalid fields + inline messages. |
| `39-state-404-light.png` / `40-state-500-light.png` | Branded **404** / **500** pages. |
| `43-dialog-invite-member.png` | **Invite member** dialog (email, role, department, Send invite). |
| `44/45-confirm-destructive-*.png` | **Confirm dialog** (Purge retired), light + dark. |
| `46-avatar-user-menu.png` | **Avatar menu** popover (profile / settings / theme / sign out). |
| `47-columns-menu-updated.png` | Device list **Columns** menu (current default column set). |
| `48-bulk-bar-and-popover.png` | **Bulk selection** — selected rows + bulk **Role** popover (Members). |
| `49-toast.png` | **Toasts** (success + info), Sonner-style, bottom-right. |
| `50-confirm-delete-devices.png` | **Confirm delete** for bulk device delete. |

> Notes: screenshots are 924×540 hero captures (the established standard for this bundle) — open
> the HTML files for full-page detail. Dark variants are provided for the main screens + the most
> theme-distinct states; the rest follow the same tokens. No mobile captures — see "Responsive & mobile".

## Files in this bundle
- `schema.sql` — **relational schema** (PostgreSQL DDL + `device_with_flags` view). Source of truth for the data model.
- `migrations/003_members.sql` — **members & access** (member table, role/status enums, role-label fn). Run after `schema.sql`.
- `migrations/004_settings.sql` — **settings** (`org_settings` singleton + `user_preference`; replaces the flags view with `devices_with_flags(p_warranty_days)`). Run after `003`.
- `migrations/005_activity.sql` — **activity log** (`activity` table + `activity_action` enum) backing the Recent-activity timelines + audit trail. Run after `003`.
- `seed.sql` — **demo data** (catalogs + 12 devices + cover photos + **8 members** + the **settings** singleton + a `user_preference`). Run last; idempotent via `ON CONFLICT`.
- `types.ts` — TS row types + Zod form schemas + `deriveFlags(opts)` + `Member`/`OrgSettings`/`UserPreference` + `CAPABILITIES` matrix + status/role/flag meta maps.
- `theme/tokens.css` — **production shadcn theme** (light + dark + ramp + Tailwind v4 mapping). The real artifact.
- `theme/components.css` — vanilla-CSS shadcn simulation used by the mocks (reference only; use real shadcn).
- `theme/states.css`, `theme/states.js` — **state patterns** (skeleton, error, empty, permission, toast, confirm) for the mocks → use shadcn Skeleton / Sonner / AlertDialog in prod.
- `theme/shell.css`, `theme/shell.js` — sidebar/topbar shell + `DH.bulkBar`, `DH.popoverMenu`, avatar menu (reference only).
- `theme/catalog.js`, `theme/data.js` — catalog renderer + seed data / status map (data shape is useful).
- `theme/uploads.js` — photo + document dropzone behavior (preview, drag-drop, type icons, remove).
- `Login.html`, `Overview.html`, `Device List.html`, `Device Details.html`, `Create Device.html`, `Edit Device.html`,
  `Departments.html`, `Groups.html`, `Manufacturers.html`, `Members.html`, `Member Profile.html`, `Settings.html` — the screen references.
- `states/*.html` — the loading / error / empty / validation / permission / 404 / 500 state references.
- `DeviceHub Mobile.html` + `mobile/mobile.css` + `mobile/mobile-screens.js` — the **mobile design** (all screens in iOS frames, 2 nav options, bottom tab bar). See "Responsive & mobile".
- `DeviceHub Theme.html` — the living style guide (palette, rules, ramp, token tables, components).

## Suggested build order
1. Apply `tokens.css` + fonts + `shadcn init`.
2. Stand up Supabase: run `schema.sql` → `migrations/003_members.sql` → `migrations/004_settings.sql` → `migrations/005_activity.sql` → `seed.sql`; `supabase gen types` (check against `types.ts`); enable **RLS** per "Role-gating".
3. Build the app shell (sidebar + topbar + theme toggle + **avatar menu**) and shared **toast / confirm / skeleton / empty / error** primitives (Sonner / AlertDialog / Skeleton).
4. Auth (Google SSO via Supabase) + the `member` lookup that drives role-gating.
5. Overview dashboard (read-only aggregates).
6. Device list (table + filters + URL params + view toggle + column visibility + **bulk actions** + states).
7. Device details (+ `deriveFlags` with the configured warranty window).
8. Create + Edit forms (react-hook-form + Zod; **validation states**; photo gallery + documents → Storage).
9. Catalog pages (+ count → filtered-list links + add/edit dialog).
10. Members + Member profile (+ invite dialog + bulk role/remove + permissions matrix).
11. Settings (org_settings + user_preference; admin-gated; **purge** confirm).
12. Login + 404/500.
