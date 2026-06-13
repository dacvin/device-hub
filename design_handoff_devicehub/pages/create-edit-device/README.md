# Pages — Create Device & Edit Device

**References:** `reference_html/Create Device.html` (route `/devices/new`),
`reference_html/Edit Device.html` (route `/devices/[code]/edit`). **Nav:** Devices (active).
**Access:** all roles. They share the same form layout and field set; Edit is **prefilled** from the
device and adds a Delete action.

---

## Purpose
Register a new device / update an existing one. Long form split into labelled sections with a sticky
section-nav rail for fast jumping.

## Layout (`/devices/new` default — "single-page")
- Back link → `/devices` (Create) or `/devices/[code]` (Edit).
- (Edit only) **edit header**: group-icon tile + "Edit {name}" + `code` (mono).
- **`.form-cols`** grid `220px 1fr`, gap 32:
  - **Left:** sticky **section nav** (`.secnav`, numbered) — clicking scrolls to that section.
    *Hidden ≤1000px.*
  - **Right:** stack of **section cards**, then a sticky **action bar**.
- Create also ships a **stepped/wizard variant** (`renderStepped`: one section per step + Review).
  **Default = single-page**; the stepper is an alternative — pick one (single-page recommended for
  desktop; the wizard maps better to mobile — see MOBILE.md).

## Sections, fields & data mapping
Six sections. Field → `Device` property, control type, and validation (validation expressed as
behavior — turn each into a Zod rule):

### General (`info`)
| Label | Field | Control | Validation |
|---|---|---|---|
| Device name | `name` | text | **required**, 1–80 |
| Device code | `code` | text, mono | **required**, unique; hint "Auto-suggested from group" (prefix `DEV-`) |
| Group | `group` | select ← `Lookups.groups` | **required** |
| Status | `status` | select [In use/In storage/In repair/Retired] | **required**; hint clarifies alerts are tracked separately. Map labels ↔ enum (`in-use`/`storage`/`repair`/`retired`). |

### Classification (`tags`)
Manufacturer→`mfr` (select ← manufacturers) · Model→`model` (text) · Serial number→`sn` (text, mono)
· Unit→`unit` (**segmented** ← units, default first) · Quantity→`qty` (number, default 1) ·
Specifications→`spec` (textarea, full-width).

### Lifecycle (`activity`)
Source→`source` (select ← sources) · Import date→`imported` (date) · Condition→`cond`
(**range slider 0–100**, live `%` readout, default 100) · Storage position→`loc` (text, full) · Last
check date→`lastCheck` (date) · Inventory cycle→`cycle` (number months; defaulted from group).

### Warranty (`shield-check`)
Warranty start→`wStart` (date) · Warranty end→`wEnd` (date). *(Behavior: `wEnd` ≥ `wStart`.)*

### Photos & documents (`paperclip`)
- **Device photos** — drag-drop / click dropzone, multiple, first = cover, reorderable; "PNG or JPG,
  up to 5 MB each". → `DevicePhoto[]`.
- **Documents** — dropzone, "Invoices, warranty cards, manuals · PDF, DOCX, XLSX, images". →
  `DeviceDocument[]`. Recreate with your upload component; mock previews locally only.

### Notes (`sticky-note`)
Note→notes (textarea, full).

> **Edit** prefills every control from the device (selects mark `selected`, segmented marks `on`,
> slider + readout set to `cond`, photos/docs pre-populated with sample items).

## Interactive elements
| Element | Action |
|---|---|
| Section-nav item (×6) | smooth-scroll to that section card |
| Segmented Unit | single-select toggle |
| Condition slider | updates live `%` readout |
| Photo dropzone | add/remove/reorder photos (cover = first) |
| Docs dropzone | add/remove files |
| **Create** (Create page) | success: toast "Device created…" → redirect `/devices` (~650ms); bypasses the unsaved-guard |
| **Save changes** (Edit) | toast "Changes saved · {name} has been updated." |
| **Delete device** (Edit, destructive, left of action bar) | **confirm** "Delete {name}?" → toast "Device deleted" → redirect `/devices` |
| **Cancel** | → back; triggers the unsaved-changes guard if dirty |
| (Stepper) Continue / Back | advance/retreat steps; final step = Review then Create |

## Unsaved-changes guard (Create — important behavior)
Any input/change/photo/doc/segment interaction marks the form **dirty**. While dirty:
- **In-app navigation** (Cancel, Back, sidebar links) is intercepted → **confirm** "Leave without
  saving? · Unsaved data on this form will be lost." (Leave / Stay, warn tone). Confirming bypasses
  the guard and proceeds.
- **Tab close / refresh** → native `beforeunload` prompt.
- Successful **Create** clears the guard before redirecting.
Recreate with a route-change guard (e.g. `next/navigation` + `beforeunload`) and an `<AlertDialog>`.

## States
- **Validation errors:** `states/Create Device - Validation errors.html` — required fields show the
  destructive border + inline messages; show on submit. (Mirror with Zod + form errors.)
- Loading is negligible (no fetch on Create; Edit fetches the device — show field skeletons).

## Responsive
`.form-cols` → 1 col & section-nav hidden ≤1000; `fgrid` → 1 col ≤640; (stepper) step labels hide on
narrow. Action bar stays sticky. See `images/`.

## Icons used
arrow-left, info, tags, activity, shield-check, paperclip, sticky-note, check, arrow-left/right,
clipboard-check, trash-2, image-plus, upload, x + file-type icons (file-text, file-spreadsheet, …).
