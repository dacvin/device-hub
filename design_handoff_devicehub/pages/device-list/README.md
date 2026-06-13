# Page — Device List (inventory)

**Reference:** `reference_html/Device List.html` · **Route:** `/devices` · **Nav:** Devices ·
**Access:** all roles. **Data:** `Device[]` (see `types/devicehub.ts`).

---

## Purpose
The main inventory browser: filter/search the fleet, switch between a dense **Table** and a
**Cards** view, toggle columns, select rows for **bulk** export/delete, and jump into any device.

## Layout
1. **Topbar actions** (`topbar-actions` template): search box (placeholder "Search code, name,
   serial…"), **Export** (outline), **Create device** (primary → `/devices/new`).
2. **Toolbar** (`.toolbar`, wraps): Group select · Status select · Flag select · Manufacturer select
   · **Clear** chip (dashed, only when a filter is active) · spacer · **Columns** button (right).
3. **Result count** line: "`{filtered} of {total} devices`".
4. **View** — one of: Table card (default) **or** Cards grid **or** empty-state card.
5. Floating **view switcher** (Table / Cards) and **bulk bar** (when rows selected).

## Filtering & search (state → behavior)
`DeviceListFilters { group, status, mfr, flag, q }`. A device passes if it matches **all** active
filters; `q` is a case-insensitive substring over `code + name + sn + model`. Filters can be
**pre-applied from the URL** — `?group=`, `?status=`, `?mfr=`, `?flag=` (set by Overview & catalog
pages). "Clear" resets all and hides itself.

## Table view — column registry & field mapping
The table is driven by a **column registry**; this is the field→column map (the part you asked to be
explicit). Columns render in this order; **two are hidden by default** (`mfr`, `loc`) and toggled via
the Columns menu. Selection persists hidden columns in `localStorage["dh-cols-hidden"]`.

| Column | Header | Source field(s) | Render / how combined |
|---|---|---|---|
| `photo` | (none) | `group` (+ `photo`) | group icon on a mint tile (thumbnail) |
| `code` | Code | `code` | monospace, muted |
| `name` | Name | `name` | **link → `/devices/[code]`**; always on (required column) |
| `group` | Group | `group` | `badge-secondary` |
| `mfr` | Manufacturer / Model | `mfr` + `model` | **two fields, one cell:** `mfr` on line 1, `model` muted on line 2 (line 2 hidden in compact). *Hidden by default.* |
| `cond` | Condition | `cond` | value `%` + colored progress bar (green/amber/red via `conditionColor`) |
| `loc` | Location | `loc` | muted, truncated. *Hidden by default.* |
| `status` | Status | `status` | `DH.statusBadge` → tone pill + dot |
| `flags` | Flags | derived `deviceFlags(d)` | flag chips (icon+label); "—" when none |
| `qty` | Qty | `qty` | tabular number |
| (fixed) | leading | — | selection **checkbox** |
| (fixed) | trailing | — | row actions: **Edit** (pencil → `/devices/[code]/edit`) · **Delete** (trash → confirm) |

Header row: leading tri-state select-all checkbox; "Name" is locked-on in the Columns menu.
Below the table: a **pager** ("Showing 1–N of N" + prev/1/2/next) — static in the mock; wire to real
pagination (or virtualize). Table has `min-width:880px` and scrolls horizontally on small screens.

## Cards view — field mapping
`grid` of device cards (`auto-fill, minmax(280px,1fr)`). Each card (click → `/devices/[code]`):
- **Cover:** `photo` image if present, else group icon on a mint gradient; **status badge** pinned
  top-right.
- **Body:** `name` (15/600) · `code` (mono) · a 2-col meta grid — **Manufacturer** (`mfr`) ·
  **Group** (`group`) · **Model** (`model`, spans full width) · **Location** (`loc`, spans full
  width) · flag chips (if any) · footer = condition bar + "Qty {qty}".
- ✅ The Cards view now binds only canonical `Device` fields (the earlier `dept`/Department cell was
  removed). If your backend genuinely has a Department concept, add it deliberately as a real field +
  catalog (see `types/devicehub.ts` DIVERGENCE).

## Interactive elements
| Element | Action |
|---|---|
| Search input | live-filters on `q` |
| Group / Status / Flag / Manufacturer selects | set the matching filter, re-render |
| Clear chip | reset all filters + search |
| Columns button | opens **Columns dropdown** (below) |
| View switcher (Table / Cards) | swaps the view; in product, default = **Table** (drop the switcher chrome) |
| Row checkbox / header checkbox | toggle selection / select-all-in-view (tri-state) |
| Name cell / whole card | → `/devices/[code]` |
| Row Edit / Delete | → edit route / **confirm** delete ("Delete {name}?" → toast "Device deleted · Moved to the recycle bin.") |
| Export (topbar) | export current view to CSV (toast "Export started") |
| Create device | → `/devices/new` |
| Bulk **Export** | toast "Export started · Preparing a CSV of N devices…" then clears selection |
| Bulk **Delete** | **confirm** "Delete N devices?" → removes + toast |

## Dropdowns
**Columns menu** (`#colMenu`, anchored under the Columns button → shadcn `<DropdownMenu>` with
checkbox items): header "Toggle columns", one toggle per registry column; "Name" is **locked**
(disabled, "Required"). Toggling updates the table immediately and persists hidden set.

## States (all in `states/`)
| State | File | Notes |
|---|---|---|
| Loading | `Device List - Loading.html` | toolbar + `DH.sk.table()` skeleton rows |
| Empty — no filters | (in-page) | icon `hard-drive`, "No devices yet", CTA "Create device" |
| Empty — filtered | (in-page) | icon `search-x`, "No devices match these filters", "Clear filters" + "Create device" |
| Empty — first run | `Device List - Empty (first run).html` | brand-new workspace |
| Error | `Device List - Error.html` | `DH.errorState()` — cloud-alert, "Try again" |

## Responsive
Toolbar wraps; table scrolls horizontally; Cards grid reflows by min-width; sidebar→drawer ≤980;
topbar actions wrap ≤640. See `images/`.

## Icons used
search, download, plus, sliders-horizontal, x, chevron-left/right, pencil, trash-2, check, minus,
arrow-right, + all group icons + status/flag icons.
