# Pages — Catalogs: Groups · Units · Manufacturers

**References:** `reference_html/Groups.html`, `Units.html`, `Manufacturers.html`.
**Routes:** `/catalog/groups`, `/catalog/units`, `/catalog/manufacturers`. **Nav group:** Catalog.
**Access:** all roles. **All three share one engine:** `reference_html/theme/catalog.js`
(`renderCatalog(cfg)`). Build **one reusable `<CatalogTable>` component** parametrized by config.

---

## Purpose
Manage the lookup tables that populate the device form's selects. Each row shows how many devices
reference it, and links to that filtered Device List. Rows can be created, edited, and deleted —
**but only when no device references them**.

## Shared layout
- **Topbar actions:** search ("Search {plural}…") · Export (outline) · **Create {singular}** (primary).
- **Meta line:** "`{itemCount} {plural} · {totalDevices} devices catalogued`".
- **Card table:** leading select-all checkbox · **Name** (with optional row icon) · *config columns* ·
  **Devices** column · row actions. Min-width 720, horizontal scroll.

## The "Devices" column (field combination you asked about)
For each catalog row, the engine counts `DEVICES` where `device[cfg.field] === row.name`
(`field` = `group` | `unit` | `mfr`). The cell renders a **mini progress bar** (fill =
`count/total %`) + the **count** + an arrow, all wrapped in a **link → `/devices?{field}={name}`**.
So the data combine is: *(catalog row name) ⟕ (device foreign key)* → aggregated count + percent-of-fleet.

## Per-catalog config (name = join key in all three)
| Catalog | `field` | Extra column(s) | Create/Edit form fields | Row icon |
|---|---|---|---|---|
| **Groups** | `group` | "Default inventory cycle" = `{cycle} months` | Name · **Icon** (icon-picker) · Default inventory cycle (number, default 12) | per-row `icon` (laptop/monitor/…) |
| **Units** | `unit` | "Description" = `desc` or "—" | Name · Description (text) | none |
| **Manufacturers** | `mfr` | "Support contact" = `support` (mono) | Name · Support contact (text, mono) | none |

`Group.cycle` is meaningful: it pre-fills the inventory cycle on new devices of that group.

## Interactive elements
| Element | Action |
|---|---|
| Search | filter rows by name |
| Create {singular} | open the **create/edit dialog** (below) in create mode |
| Row **Devices** link | → `/devices?{field}={name}` |
| Row **Edit** (pencil) | open dialog prefilled |
| Row **Delete** (trash) | **disabled** when count>0 (tooltip "Can't delete — N devices assigned"); else **confirm** delete |
| Row checkbox / header | select / select-all-in-view (tri-state) |
| Bulk **Export** | toast "Export started · Preparing a CSV of N {plural}…" |
| Bulk **Delete** | deletes only rows with no devices; blocked ones are skipped with an explanatory toast; if **none** deletable → error toast "Can't delete · N {plural} still have devices assigned." |

## Dialog — Create / Edit {singular} (`<Dialog>`)
Header: "Create {Singular}" / "Edit {singular}" + a description ("New {plural} become selectable when
adding or editing a device."). Body: a **Name** field (required) + the config fields above. The
**icon picker** (Groups) is a grid of ~22 lucide options, single-select. Footer: Cancel (ghost) +
Create/Save (primary). Closes on Esc / overlay / Cancel. On save: validates Name non-empty (red
border if missing), upserts, re-sorts alphabetically (create), toasts "{Singular} created/updated".

## Delete guard (key business rule)
A catalog value cannot be deleted while any device references it. Enforce on the **API** too, not
just the disabled button — return the in-use count so the UI can explain the block.

## States
- Search empty → in-card "No {plural} match '{q}'."
- Reuse `DH.emptyState()` for a truly empty catalog and `DH.errorState()` for load failure.

## Responsive
Table scrolls horizontally; topbar actions wrap ≤640; sidebar → drawer ≤980; dialog full-bleed ≤640
(icon picker grid → 5 cols). See `images/` (one set per catalog).

## Icons used
search, download, plus, pencil, trash-2, check, minus, arrow-right + group icons + the icon-picker set
(laptop, monitor, printer, network, server, smartphone, webcam, hard-drive, cpu, keyboard,
mouse-pointer, tablet, router, tv, box, boxes, package, layers, container, scale-3d, ruler, blocks).
