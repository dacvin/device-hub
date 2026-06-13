# Page — Device Details

**Reference:** `reference_html/Device Details.html` · **Route:** `/devices/[code]` · **Nav:** Devices
(active) · **Access:** all roles. **Data:** one `Device` (mock uses `DEVICES[0]`; in product fetch by
`code`). Reference "today" for the warranty countdown = `2026-05-29`.

---

## Purpose
The full read view of one device: identity, specs, allocation, lifecycle, warranty, notes, a
condition gauge, and recent activity — with edit / print / duplicate / delete actions.

## Layout
- **Back link** → `/devices`.
- **Device header** (`.dhead`): big group-icon tile · `name` (24/600) · sub-row [`code` mono ·
  vertical sep · group badge · status badge · flag chips] · right-aligned action cluster
  [**Print label** (outline), **⋯ more** (icon-outline), **Edit device** (primary)].
- **Body — default ("two-column") layout:** `.cols` grid `1fr 320px`:
  - **Left stack** of section cards: Identification · Specifications · Allocation · Lifecycle ·
    Warranty · Notes.
  - **Right rail (320px):** Condition card (ring) · quick-stats card · Recent activity card.
- A **tabbed variant** exists (`renderTabbed`: Details / Warranty & lifecycle / History) — it is a
  prototype alternative. **Default = the two-column layout**; treat tabs as optional, not both.

## Sections & data mapping
Each section card = uppercase eyebrow title + lucide icon + a definition list (`.dl`, 2-col of
key/value). Mapping:

| Section | Icon | Fields shown (key → Device field) |
|---|---|---|
| Identification | fingerprint | Code→`code`(mono) · Serial number→`sn`(mono) · Name→`name` · Manufacturer→`mfr` · Model→`model` · Group→`group` |
| Specifications | cpu | free-text paragraph ← `spec` |
| Allocation | map-pin | Assigned location→`loc` · Group→`group` · Unit→`unit` · Quantity→`qty` · Source→`source` |
| Lifecycle | activity | Import date→`imported` · Source→`source` · Condition→`cond%` · Inventory cycle→`cycle` months · Last checked→`lastCheck` · Next check due→**derived** (`lastCheck` + `cycle`) |
| Warranty | shield-check | Warranty start→`wStart` · Warranty end→`wEnd` · Coverage→**derived** `warrantyDaysRemaining` ("N days remaining" or "Expired") |
| Notes | sticky-note | free-text ← notes (illustrative in mock) |

Dates render `DD MMM YYYY` (en-GB). 

**Right rail:**
- **Condition card:** SVG ring, % from `cond`, arc color via `conditionColor`; caption "Last assessed
  {lastCheck}".
- **Quick stats:** Warranty ("{days} days left · ends {wEnd}") · Next inventory (due date) ·
  Location (`loc`) · Group (`group`).
- **Recent activity:** timeline (illustrative — wire to audit feed).

## Interactive elements
| Element | Action |
|---|---|
| Back link | → `/devices` |
| Print label (header) | toast "Printing label · Sending {code} to the label printer…" (stub the print job) |
| **⋯ more** menu | opens **popover** (below) |
| Edit device (header) | → `/devices/[code]/edit` |
| Tabs (if you keep the tabbed variant) | swap section groups; no navigation |

## Dropdown — "⋯ more" popover (`DH.popoverMenu` → `<DropdownMenu>`)
Header = `code`. Items: **Edit device** (pencil → edit) · **Duplicate** (copy → toast "Device
duplicated · A copy of '{name}' was created as a draft.") · **Print label** (printer → toast) ·
separator · **Delete device** (trash, danger) → **confirm** "Delete {name}?" → toast "Device deleted
· Moved to the recycle bin." then redirect to `/devices` after ~600ms.

## States
No dedicated loading/empty/error files for Details in `states/` — reuse the shared helpers: skeleton
header + cards while fetching; `DH.errorState()` on fetch failure; a 404 (`states/404 Not found.html`)
if the `code` doesn't resolve.

## Responsive
`.cols` 2-col → 1-col ≤1080 (rail drops below the content); header action cluster wraps; sidebar →
drawer ≤980. See `images/`.

## Icons used
arrow-left, printer, ellipsis, pencil, copy, trash-2, fingerprint, cpu, map-pin, activity,
shield-check, sticky-note, gauge, calendar-clock, layers, history, plus, check.
