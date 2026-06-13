# Page — Overview (dashboard)

**Reference:** `reference_html/Overview.html` · **Route:** `/` · **Nav:** Overview · **Access:** all roles.
**Data:** computed entirely from the `Device[]` list (no separate dashboard endpoint in the mock —
derive client-side or add an aggregate endpoint). Reference "today" = `2026-05-30` (`DH_TODAY`).

---

## Purpose
The fleet-health landing page. At-a-glance KPIs, the lifecycle split, inventory by group, what
needs attention, and a recent-activity feed. Every number deep-links into a filtered Device List.

## Layout
- Top: **KPI row** — 4 stat cards, `grid-template-columns: repeat(4,1fr)`, gap 16. → 2-up ≤1080px → 1-up ≤640px.
- Below: **`.dash`** 2-column grid `1fr 340px`, gap 20 (→ 1 col ≤1080px):
  - **Left stack:** "Lifecycle status" card, then "Inventory by group" card.
  - **Right stack (340px rail):** "Needs attention" card, then "Recent activity" card.

## Sections & data mapping

### 1. KPI cards (`#kpis`)
Four `.card.kpi` = label + icon tile + big value (30/600 tabular) + sub-line. Mapping:
| Card | Value | Sub-line | Source |
|---|---|---|---|
| Total devices | `devices.length` | `Σ qty` units across `Lookups.groups.length` groups | count + sum of `Device.qty` |
| In use | count `status==="in-use"` | `{storage} in storage · {retired} retired` | status counts |
| Needs attention | `# devices with deviceFlags().length>0` | "Warranty & inventory flags"; card gets `.alert` style (amber icon) when >0 | derived flags |
| In repair | count `status==="repair"` | "Avg. condition {avg}% fleet-wide" | `round(mean(cond))` |

### 2. Lifecycle status (`#lifebar` + `#legend`)
A single stacked bar: one `<span>` per status, width = `count/total %`, color from `STATUS_COLOR`
(in-use=green-500, storage=sky, repair=amber, retired=muted-fg). Legend below = 2-col grid; **each
legend row is a link** to `/devices?status={key}` showing swatch · label · count · percent.

### 3. Inventory by group (`#grouprows`)
One row per group **that has devices**, sorted by count desc. Row = group icon + name · progress
track (fill width = `count/total %`, primary fill) · count + percent. **Each row links** to
`/devices?group={name}`. Card header has a "Manage groups" ghost link → `/catalog/groups`.

### 4. Needs attention (`#attn`)
Lists devices where `deviceFlags(d).length>0`. Each `.attn-row` (a **link** → `/devices/[code]`) =
group-icon tile + name + `code` (mono) + compact **icon-only flag chips** (label hidden in this
narrow rail, shown as tooltip). Card subtitle: `{n} devices flagged · {repair} in repair`. **Empty
state:** "No devices need attention right now." / subtitle "Everything is on track".

### 5. Recent activity (`#timeline`)
Vertical timeline, dot + text (bold device names) + relative time. **Illustrative/hardcoded** in the
mock — wire to a real activity/audit feed. Active vs. older items differ by dot color.

## Interactive elements
| Element | Action |
|---|---|
| Each KPI card | static in mock; optionally link to the matching filtered list |
| Legend row (×4) | → `/devices?status={status}` |
| Group row (×N) | → `/devices?group={name}` |
| "Manage groups" link | → `/catalog/groups` |
| Attention row (×N) | → `/devices/[code]` (mock links to Device Details) |
| Topbar: theme toggle / user menu / nav | global shell (see GLOBAL-SHELL.md) |

## States
- **Loading:** `states/Overview - Loading.html` — KPI skeletons (`DH.sk.kpis(4)`) + skeleton cards.
- **Empty (first run):** `states/Overview - Empty (first run).html` — zero devices; KPIs read 0 and a
  prominent "Register your first device" CTA → `/devices/new`.
- No error variant shipped for Overview specifically; reuse `DH.errorState()` if the aggregate fails.

## Dialogs / dropdowns
None on this page beyond the global user menu.

## Responsive
KPIs 4→2 (≤1080) →1 (≤640); dashboard 2-col → 1-col ≤1080; sidebar → drawer ≤980. See `images/`.

## Icons used
layout-dashboard, hard-drive, circle-check-big, triangle-alert, wrench, laptop, monitor, printer,
network, server, smartphone, webcam.
