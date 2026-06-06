# UI Fidelity Audit & Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring each built screen in `client/` to pixel-fidelity with its corresponding mock in `design_handoff_devicehub/`, page by page, with an independent subagent verification gate before every commit.

**Architecture:** Sequential page-by-page audit-and-fix. Each task reads the mock's HTML + linked `theme/*.css` to extract exact CSS values, builds an inline gap-report table for that page, applies surgical Tailwind fixes to the built side, then dispatches an `Explore` subagent to independently re-read mock + built code and confirm every gap is closed before commit. No new components, no token edits, no new dependencies.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn/ui, Geist + Geist Mono, lucide-react. Mocks: vanilla HTML/CSS in `design_handoff_devicehub/`.

**Spec:** `docs/superpowers/specs/2026-06-06-ui-fidelity-audit-design.md`

---

## Convention — applies to every task below

This is not TDD work. There are no unit tests for "matches the mock." The verification gate is **the subagent verification step**, which substitutes for tests. Each per-page task follows the same six-step rhythm:

1. **Build the gap-report table.** Read mock HTML + `theme/components.css` + `theme/shell.css`. For each region of the built page, record `Region · Mock value (file:line) · Built value (file:line) · Fix`. Approximations are not acceptable — chase class chains until they resolve to a number. Cite mock file:line for every value.
2. **Apply Tailwind fixes.** Prefer named tokens (`px-4`, `gap-2`, `rounded-xl`, `bg-card`). Fall back to arbitrary values (`h-[56px]`, `w-[248px]`) only when no token matches. Never inline literal hex colors — use the semantic token from `globals.css`.
3. **Sanity-check the build.** Run `pnpm --filter client typecheck` and `pnpm --filter client lint`. Both must pass before continuing.
4. **Browser check.** Run `pnpm --filter client dev`, open the page next to the mock HTML in another tab, toggle light/dark, resize through the page's documented breakpoint. Spot-check the fixed values.
5. **Subagent verification.** Dispatch an `Explore` subagent with the mock file paths, the built component paths, the gap-report table, and the page's responsive breakpoint. The subagent's job is to independently re-read both sides and confirm every row's Built value now matches the Mock value (in light, dark, and at the breakpoint). It reports `pass` or returns a list of discrepancies. **If it returns discrepancies, fix them in this task before committing — do not advance to the next task.**
6. **Commit.** One commit per page. Message format: `fix(ui): match <page> to mock`.

**Responsive breakpoints (from `design_handoff_devicehub/README.md`):**
- sidebar hides < 980px
- details collapses to one column < 1080px
- create form section nav hides < 1000px
- login art hides < 880px

**Guardrails (from the spec, repeated here so the executor doesn't have to switch documents):**
- No new components, no new dependencies, no token edits.
- No "drive-by" cleanups in adjacent files — surgical changes only.
- If a fix would require restructuring a built component significantly (≈ 50+ lines changed in one file), mark the gap row `needs-review` and stop the task to surface the question, rather than silently expanding scope.
- The mock's vanilla-CSS shadcn simulation (`components.css`, `shell.css`) is a reference — do not port it verbatim. Achieve the value through the real shadcn component's API or a className override on the built side.

---

## Task 1: App shell — sidebar + topbar

**Why first:** every internal screen sits on this shell. Fixing it once removes shell-level rows from later pages' gap reports.

**Files:**
- Read (mocks): `design_handoff_devicehub/Device List.html` (canonical shell example), `design_handoff_devicehub/theme/shell.css`, `design_handoff_devicehub/theme/components.css`
- Modify (built): `client/src/app/(app)/layout.tsx`, `client/src/components/app/sidebar.tsx`, `client/src/components/app/topbar.tsx`, `client/src/components/app/brand-mark.tsx`, `client/src/components/app/nav-items.ts`, `client/src/components/app/theme-toggle.tsx`, `client/src/components/app/page-header.tsx`, `client/src/components/app/language-switcher.tsx`

**Regions to audit (do not skip any):**
- Sidebar: width, padding, background (`--sidebar`), brand mark area, nav group label (uppercase, letter-spacing), nav item row height + padding + active state (`--sidebar-accent` bg + accent-foreground text), section gap, user chip pinned bottom.
- Topbar: height, sticky positioning, backdrop blur (8px) + background opacity (86%), title (20px/600) + crumb subtitle line-height, right-actions gap, theme toggle button size.
- Content frame: `max-width: 1320px`, padding `28px`.

- [ ] **Step 1: Build the gap-report table for the shell**

Open the three mock files, walk every region listed above, and write the table into this checkbox as a comment before continuing. Cite file:line for both sides. Example row format:

```
| Sidebar width | 248px (shell.css:LINE) | w-64 = 256px (sidebar.tsx:LINE) | w-[248px] |
```

- [ ] **Step 2: Apply Tailwind fixes for every gap row**

Edit each built file listed above. One Edit call per discrete change. Use named tokens where possible, arbitrary `[value]` only when needed, semantic color tokens only.

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
pnpm --filter client exec tsc --noEmit && pnpm --filter client lint
```
Expected: both exit 0.

- [ ] **Step 4: Browser check**

Run:
```bash
pnpm --filter client dev
```
Open `http://localhost:3000/devices` (any internal route — shell is shared) next to `design_handoff_devicehub/Device List.html` opened directly in the browser (`file://`). Toggle light/dark with the topbar toggle. Resize across 980px. Confirm sidebar width, nav active state, topbar height, blur, content max-width all match.

- [ ] **Step 5: Subagent verification**

Dispatch an `Explore` subagent with this prompt (substitute `<GAP_TABLE>` with the table from Step 1):

```
Verify UI fidelity of the app shell against its mock.

Mocks to read:
- design_handoff_devicehub/Device List.html (use only the shell markup — sidebar + topbar)
- design_handoff_devicehub/theme/shell.css
- design_handoff_devicehub/theme/components.css

Built files to verify:
- client/src/app/(app)/layout.tsx
- client/src/components/app/sidebar.tsx
- client/src/components/app/topbar.tsx
- client/src/components/app/brand-mark.tsx
- client/src/components/app/nav-items.ts
- client/src/components/app/theme-toggle.tsx
- client/src/components/app/page-header.tsx

Gap report under verification:
<GAP_TABLE>

For every row, independently re-read both the cited mock location and the cited built location. Confirm the Built value now equals the Mock value (same number, same unit, same token). Verify the result holds for:
- light mode and dark mode (tokens carry both, so check no hardcoded colors leaked in)
- the responsive breakpoint < 980px (sidebar hides)

Report format:
- If every row matches: reply with the single word "pass".
- Otherwise: list each row that fails with (region · expected · actual · file:line).
Do not propose fixes — only verify.
```

If the report is not `pass`, fix the listed discrepancies in this task and re-dispatch.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/\(app\)/layout.tsx client/src/components/app/sidebar.tsx client/src/components/app/topbar.tsx client/src/components/app/brand-mark.tsx client/src/components/app/nav-items.ts client/src/components/app/theme-toggle.tsx client/src/components/app/page-header.tsx client/src/components/app/language-switcher.tsx
git commit -m "fix(ui): match app shell to mock"
```

---

## Task 2: Login

**Files:**
- Read (mocks): `design_handoff_devicehub/Login.html`, `design_handoff_devicehub/theme/components.css`
- Modify (built): `client/src/app/login/page.tsx`, `client/src/app/login/_components/login-form.tsx`, `client/src/app/login/_components/google-g.tsx`, `client/src/app/login/_components/login-language-switcher.tsx`

**Regions to audit:**
- Page grid: `1fr 1fr`, single-column collapse < 880px.
- Left pane: padding `40px 56px`, brand mark top-left, form vertically centered, `max-width: 360px`, footer pinned bottom.
- Right (art) pane: gradient `linear-gradient(155deg, #277E69, #1F6F5F 48%, #103A33)`, blurred radial blobs, 56px grid motif, eyebrow letter-spacing `.14em`, headline 34px/600 with "accounted for." in `#6FCF97`, chips, stat row (1,284 · 8 · 98.2%).
- Google button: full-width, 46px tall, `--card` bg, 1px `--border`, 18px Google "G", focus ring 3px `--ring` at 35%.
- Managed-access note: `--secondary` bg, `shield-check` icon.
- Legal line: 12px `--muted-foreground`, link in `--primary`.

- [ ] **Step 1: Build the gap-report table for Login**

(Same format as Task 1, Step 1.)

- [ ] **Step 2: Apply Tailwind fixes for every gap row**

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter client exec tsc --noEmit && pnpm --filter client lint
```

- [ ] **Step 4: Browser check**

Open `http://localhost:3000/login` next to `Login.html`. Toggle light/dark (Login may not have a toggle — verify both modes via the existing theme persistence). Resize across 880px (art panel hides).

- [ ] **Step 5: Subagent verification**

```
Verify UI fidelity of Login against its mock.

Mocks:
- design_handoff_devicehub/Login.html
- design_handoff_devicehub/theme/components.css

Built files:
- client/src/app/login/page.tsx
- client/src/app/login/_components/login-form.tsx
- client/src/app/login/_components/google-g.tsx
- client/src/app/login/_components/login-language-switcher.tsx

Gap report under verification:
<GAP_TABLE>

For every row, re-read mock and built locations. Confirm equality. Verify light + dark + the < 880px breakpoint (art panel hides).
Report format: "pass" or a list of (region · expected · actual · file:line). Do not propose fixes.
```

- [ ] **Step 6: Commit**

```bash
git add client/src/app/login
git commit -m "fix(ui): match login to mock"
```

---

## Task 3: Device List

**Files:**
- Read (mocks): `design_handoff_devicehub/Device List.html`, `design_handoff_devicehub/theme/components.css`
- Modify (built): `client/src/app/(app)/devices/page.tsx`, `client/src/app/(app)/devices/_components/device-list-client.tsx`, `client/src/components/app/status-badge.tsx`, `client/src/components/app/flag-chip.tsx`, `client/src/components/app/condition-bar.tsx`, `client/src/components/app/group-icon.tsx`

**Regions to audit:**
- Toolbar row: filter group (Group · Department · Status · Flag · Manufacturer · search), "Clear" dashed chip, right-aligned Columns button.
- Result-count line: typography + spacing above the data view.
- View toggle (ToggleGroup): segmented control swap between table ↔ cards.
- Table: row height `56px`, header typography, checkbox column, group icon column, code (mono, muted), name (linked), Group `secondary` badge, Department, Manufacturer/Model (2-line), Condition (bar + %), Location, Status badge, Flags (zero+ chips), Qty, row actions revealed on hover, hover bg `--muted`.
- Condition bar: 56×6px track (`--muted`), fills — ≥70 `--green-500`, 40–69 `oklch(0.78 0.13 75)`, <40 `--destructive`.
- Cards view: grid `minmax(280px, 1fr)`, gap 16px. Card = cover banner (status badge overlaid) + name + code + dept/group/location meta grid + flag chips + condition bar + qty footer. Hover lifts border to `--ring`. Banner falls back to group icon when no photo.
- Columns dropdown: `DropdownMenu` with `DropdownMenuCheckboxItem`s, "Name" locked.

- [ ] **Step 1: Build the gap-report table for Device List**

- [ ] **Step 2: Apply Tailwind fixes for every gap row**

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter client exec tsc --noEmit && pnpm --filter client lint
```

- [ ] **Step 4: Browser check**

Open `http://localhost:3000/devices`. Toggle view (table ↔ cards). Open Columns dropdown, toggle a column. Hover a row to confirm action reveal. Toggle light/dark. Resize across 980px.

- [ ] **Step 5: Subagent verification**

```
Verify UI fidelity of Device List against its mock.

Mocks:
- design_handoff_devicehub/Device List.html
- design_handoff_devicehub/theme/components.css

Built files:
- client/src/app/(app)/devices/page.tsx
- client/src/app/(app)/devices/_components/device-list-client.tsx
- client/src/components/app/status-badge.tsx
- client/src/components/app/flag-chip.tsx
- client/src/components/app/condition-bar.tsx
- client/src/components/app/group-icon.tsx

Gap report under verification:
<GAP_TABLE>

For every row, re-read mock and built locations. Confirm equality. Verify table-mode and cards-mode, light + dark, the < 980px breakpoint (sidebar hides). Confirm Columns dropdown locks "Name" and persists to localStorage("dh-cols").
Report format: "pass" or a list of (region · expected · actual · file:line). Do not propose fixes.
```

- [ ] **Step 6: Commit**

```bash
git add client/src/app/\(app\)/devices/page.tsx client/src/app/\(app\)/devices/_components/device-list-client.tsx client/src/components/app/status-badge.tsx client/src/components/app/flag-chip.tsx client/src/components/app/condition-bar.tsx client/src/components/app/group-icon.tsx
git commit -m "fix(ui): match device list to mock"
```

---

## Task 4: Device Details

**Files:**
- Read (mocks): `design_handoff_devicehub/Device Details.html`, `design_handoff_devicehub/theme/components.css`
- Modify (built): `client/src/app/(app)/devices/[code]/page.tsx`, `client/src/components/app/condition-ring.tsx` (and shared badges if needed)

**Regions to audit:**
- Back link spacing.
- Header: 54px group icon, name, code, group badge, derived-status badge, right-aligned action buttons (Print label / more / Edit device).
- Body grid: `1fr 320px`, collapses < 1080px.
- Left cards (Identification, Specifications, Allocation, Lifecycle, Warranty, Notes): card radius `--radius-xl` (14px), uppercase section title with small primary icon, 2-col definition list — key 12px muted / value 14px/500, mono for codes.
- Right rail: Condition card (SVG donut ring 84px, colored by value matching condition-bar logic), stat list card, "Recent activity" timeline card (24px dots + connecting line).

- [ ] **Step 1: Build the gap-report table for Device Details**

- [ ] **Step 2: Apply Tailwind fixes for every gap row**

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter client exec tsc --noEmit && pnpm --filter client lint
```

- [ ] **Step 4: Browser check**

Open any device's detail page next to `Device Details.html`. Toggle light/dark. Resize across 1080px (body collapses to one column).

- [ ] **Step 5: Subagent verification**

```
Verify UI fidelity of Device Details against its mock.

Mocks:
- design_handoff_devicehub/Device Details.html
- design_handoff_devicehub/theme/components.css

Built files:
- client/src/app/(app)/devices/[code]/page.tsx
- client/src/components/app/condition-ring.tsx

Gap report under verification:
<GAP_TABLE>

For every row, re-read mock and built. Confirm equality. Verify light + dark, the < 1080px breakpoint (right rail wraps below main).
Report format: "pass" or a list of (region · expected · actual · file:line). Do not propose fixes.
```

- [ ] **Step 6: Commit**

```bash
git add client/src/app/\(app\)/devices/\[code\]/page.tsx client/src/components/app/condition-ring.tsx
git commit -m "fix(ui): match device details to mock"
```

---

## Task 5: Create Device

**Files:**
- Read (mocks): `design_handoff_devicehub/Create Device.html`, `design_handoff_devicehub/theme/components.css`, `design_handoff_devicehub/theme/uploads.js` (for photo/document gallery behavior reference)
- Modify (built): `client/src/app/(app)/devices/new/page.tsx`, `client/src/app/(app)/devices/_components/device-form.tsx`, `client/src/app/(app)/devices/_components/photo-gallery.tsx`, `client/src/app/(app)/devices/_components/document-list.tsx`

**Regions to audit:**
- Page grid: `220px 1fr`, sticky section nav left, action bar at bottom (Cancel / Save as draft / Create device).
- Section nav: numbered items, scrollspy active state.
- Section cards (General, Classification, Lifecycle, Warranty, Photos & documents, Notes): same card radius and section title style as Details.
- Required-field asterisk: `--destructive`.
- Controls: Input, Select, Textarea, segmented `ToggleGroup` for Unit, `Slider` for Condition (live %), file dropzones.
- Photo gallery: `.photogrid` 96px square thumbnails + dashed "Add photo" tile; first photo "Cover" badge in green; hover × remove button; drag-reorderable.
- Document list: 34px type-icon tile per row (icon picked by extension), filename, size, × button; dropzone above.
- Section nav hides < 1000px.

- [ ] **Step 1: Build the gap-report table for Create Device**

- [ ] **Step 2: Apply Tailwind fixes for every gap row**

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter client exec tsc --noEmit && pnpm --filter client lint
```

- [ ] **Step 4: Browser check**

Open `http://localhost:3000/devices/new`. Drag the Condition slider — live % displays. Scroll — section nav scrollspy updates. Hover a photo thumbnail — × appears. Toggle light/dark. Resize across 1000px.

- [ ] **Step 5: Subagent verification**

```
Verify UI fidelity of Create Device against its mock.

Mocks:
- design_handoff_devicehub/Create Device.html
- design_handoff_devicehub/theme/components.css
- design_handoff_devicehub/theme/uploads.js (reference only — for photo gallery + document list behavior)

Built files:
- client/src/app/(app)/devices/new/page.tsx
- client/src/app/(app)/devices/_components/device-form.tsx
- client/src/app/(app)/devices/_components/photo-gallery.tsx
- client/src/app/(app)/devices/_components/document-list.tsx

Gap report under verification:
<GAP_TABLE>

For every row, re-read mock and built. Confirm equality. Verify light + dark, the < 1000px breakpoint (section nav hides). Confirm: required-asterisk color, Slider live %, Cover badge on first photo, document type-icon by extension.
Report format: "pass" or a list of (region · expected · actual · file:line). Do not propose fixes.
```

- [ ] **Step 6: Commit**

```bash
git add client/src/app/\(app\)/devices/new client/src/app/\(app\)/devices/_components/device-form.tsx client/src/app/\(app\)/devices/_components/photo-gallery.tsx client/src/app/\(app\)/devices/_components/document-list.tsx
git commit -m "fix(ui): match create device to mock"
```

---

## Task 6: Edit Device

Edit reuses Create's form. Audit the deltas only.

**Files:**
- Read (mocks): `design_handoff_devicehub/Edit Device.html`
- Modify (built): `client/src/app/(app)/devices/[code]/edit/page.tsx` (and `device-form.tsx` only if Edit-specific affordances need to be added or adjusted there)

**Delta regions to audit (Edit vs Create):**
- Header: "Edit {device name}" + code with group icon.
- Action bar: left-aligned **Delete device** (`destructive`) + Cancel / Save changes on the right.
- Photos & documents section: shows existing photo (filled state with Replace/Remove), prefilled document list (e.g., invoice, warranty card, spec sheet), each removable.
- Delete confirmation: `AlertDialog`.

- [ ] **Step 1: Build the gap-report table for Edit Device (deltas only)**

- [ ] **Step 2: Apply Tailwind fixes for every gap row**

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter client exec tsc --noEmit && pnpm --filter client lint
```

- [ ] **Step 4: Browser check**

Open an existing device's edit page (`/devices/<code>/edit`). Trigger the Delete button — `AlertDialog` opens. Toggle light/dark.

- [ ] **Step 5: Subagent verification**

```
Verify UI fidelity of Edit Device against its mock.

Mocks:
- design_handoff_devicehub/Edit Device.html
- design_handoff_devicehub/theme/components.css

Built files:
- client/src/app/(app)/devices/[code]/edit/page.tsx
- client/src/app/(app)/devices/_components/device-form.tsx (only if changed in this task)

Gap report under verification (deltas vs Create):
<GAP_TABLE>

For every row, re-read mock and built. Confirm equality. Verify: header copy + group icon, Delete button is destructive variant and left-aligned, Save changes label, photos prefilled with Replace/Remove, documents prefilled and removable, AlertDialog opens on Delete.
Report format: "pass" or a list of (region · expected · actual · file:line). Do not propose fixes.
```

- [ ] **Step 6: Commit**

```bash
git add client/src/app/\(app\)/devices/\[code\]/edit
git commit -m "fix(ui): match edit device to mock"
```

---

## Task 7: Departments (catalog reference page)

Catalog pages share a shell. Departments is the canonical implementation; Groups and Manufacturers are deltas in Tasks 8 + 9.

**Files:**
- Read (mocks): `design_handoff_devicehub/Departments.html`, `design_handoff_devicehub/theme/components.css`
- Modify (built): `client/src/app/(app)/departments/page.tsx`, `client/src/app/(app)/departments/_components/departments-client.tsx`, `client/src/app/(app)/_components/catalog-page-shell.tsx`, `client/src/app/(app)/_components/catalog-link.tsx`

**Regions to audit:**
- Topbar additions: search input, Export button, "Add department" button.
- Meta line: e.g., "8 departments · 24 devices catalogued" — typography + spacing.
- Table columns: Name, Manager, Primary location, Devices (count + mini bar, link to filtered list), row actions.
- Device count link: hover reveals sliding arrow + `--accent` bg.
- Add / edit dialog: `Dialog` overlay + centered card, Esc / overlay-click / Cancel to dismiss. Fields: Name*, Manager, Primary location. Save validates non-empty Name. Trash action blocked while devices are still assigned.

- [ ] **Step 1: Build the gap-report table for Departments**

- [ ] **Step 2: Apply Tailwind fixes for every gap row**

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter client exec tsc --noEmit && pnpm --filter client lint
```

- [ ] **Step 4: Browser check**

Open `http://localhost:3000/departments`. Click a device count → navigates to filtered Device List. Click "Add department" → Dialog opens. Toggle light/dark. Resize across 980px.

- [ ] **Step 5: Subagent verification**

```
Verify UI fidelity of Departments against its mock.

Mocks:
- design_handoff_devicehub/Departments.html
- design_handoff_devicehub/theme/components.css

Built files:
- client/src/app/(app)/departments/page.tsx
- client/src/app/(app)/departments/_components/departments-client.tsx
- client/src/app/(app)/_components/catalog-page-shell.tsx
- client/src/app/(app)/_components/catalog-link.tsx

Gap report under verification:
<GAP_TABLE>

For every row, re-read mock and built. Confirm equality. Verify: device-count link arrow on hover, Dialog opens/closes (Esc, overlay, Cancel), Name field required, light + dark, < 980px sidebar hides.
Report format: "pass" or a list of (region · expected · actual · file:line). Do not propose fixes.
```

- [ ] **Step 6: Commit**

```bash
git add client/src/app/\(app\)/departments client/src/app/\(app\)/_components/catalog-page-shell.tsx client/src/app/\(app\)/_components/catalog-link.tsx
git commit -m "fix(ui): match departments to mock"
```

---

## Task 8: Groups (catalog delta)

**Files:**
- Read (mocks): `design_handoff_devicehub/Groups.html`
- Modify (built): `client/src/app/(app)/groups/page.tsx`, `client/src/app/(app)/groups/_components/groups-client.tsx`

**Delta regions to audit (Groups vs the shared catalog shell fixed in Task 7):**
- Name column prefixes a 34px icon tile.
- Extra column: Default inventory cycle (number + "months").
- Add / edit dialog fields: Name*, Icon (picker from lucide set), Default inventory cycle (number + months suffix).
- Dark-mode reference: screenshot `10-groups-dark.png` (verify in dark).

- [ ] **Step 1: Build the gap-report table for Groups (deltas only)**

- [ ] **Step 2: Apply Tailwind fixes for every gap row**

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter client exec tsc --noEmit && pnpm --filter client lint
```

- [ ] **Step 4: Browser check**

Open `http://localhost:3000/groups`. Click "Add group" → Icon picker present, inventory-cycle field has months suffix. Toggle dark mode (matches `10-groups-dark.png`).

- [ ] **Step 5: Subagent verification**

```
Verify UI fidelity of Groups against its mock.

Mocks:
- design_handoff_devicehub/Groups.html
- design_handoff_devicehub/theme/components.css

Built files:
- client/src/app/(app)/groups/page.tsx
- client/src/app/(app)/groups/_components/groups-client.tsx

Gap report under verification (deltas from the shared catalog shell):
<GAP_TABLE>

For every row, re-read mock and built. Confirm equality. Verify: 34px icon tile on Name, inventory-cycle column + suffix, Icon picker in Add dialog. Light + dark.
Report format: "pass" or a list of (region · expected · actual · file:line). Do not propose fixes.
```

- [ ] **Step 6: Commit**

```bash
git add client/src/app/\(app\)/groups
git commit -m "fix(ui): match groups to mock"
```

---

## Task 9: Manufacturers (catalog delta)

**Files:**
- Read (mocks): `design_handoff_devicehub/Manufacturers.html`
- Modify (built): `client/src/app/(app)/manufacturers/page.tsx`, `client/src/app/(app)/manufacturers/_components/manufacturers-client.tsx`

**Delta regions to audit (Manufacturers vs the shared catalog shell fixed in Task 7):**
- Extra column: Support contact, mono font.
- Add / edit dialog fields: Name*, Support contact (mono).

- [ ] **Step 1: Build the gap-report table for Manufacturers (deltas only)**

- [ ] **Step 2: Apply Tailwind fixes for every gap row**

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm --filter client exec tsc --noEmit && pnpm --filter client lint
```

- [ ] **Step 4: Browser check**

Open `http://localhost:3000/manufacturers`. Support contact column uses mono. Open Add dialog — Support contact input renders in mono.

- [ ] **Step 5: Subagent verification**

```
Verify UI fidelity of Manufacturers against its mock.

Mocks:
- design_handoff_devicehub/Manufacturers.html
- design_handoff_devicehub/theme/components.css

Built files:
- client/src/app/(app)/manufacturers/page.tsx
- client/src/app/(app)/manufacturers/_components/manufacturers-client.tsx

Gap report under verification (deltas from the shared catalog shell):
<GAP_TABLE>

For every row, re-read mock and built. Confirm equality. Verify: Support contact column uses mono font, Support contact field in Add dialog uses mono. Light + dark.
Report format: "pass" or a list of (region · expected · actual · file:line). Do not propose fixes.
```

- [ ] **Step 6: Commit**

```bash
git add client/src/app/\(app\)/manufacturers
git commit -m "fix(ui): match manufacturers to mock"
```

---

## Done criteria (from the spec)

- All nine pages have a closed gap-report table — every row's Built value matches the Mock value, or is explicitly marked `needs-review` / `unresolved` with the user's sign-off.
- Each page has its own `fix(ui): match <page> to mock` commit.
- App passes `pnpm --filter client exec tsc --noEmit` and `pnpm --filter client lint`.
- Light + dark mode verified per page.
- Subagent verification returned `pass` for every page before its commit.
