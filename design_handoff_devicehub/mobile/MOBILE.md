# Mobile

There are **two** mobile stories. Know which you're building.

1. **Responsive desktop** — every web page already reflows to phone widths (sidebar → drawer,
   grids → single column, tables scroll). This is the *default* mobile experience and is documented
   in each page's README "Responsive" section + the table in the root README §7. Each page folder's
   `images/` includes a **390px** capture.

2. **Purpose-built mobile layout** — `reference_html/DeviceHub Mobile.html` +
   `reference_html/mobile/mobile-screens.js` + `mobile.css`. This is a **separate, phone-native
   layout** (not the responsive desktop): a **bottom tab bar** instead of the sidebar, compact list
   rows, a hero device header, sticky form action bars, and a **More** tab that houses the catalogs
   + settings. Mock screens are rendered inside an iOS device frame.

> ✅ **The mobile mock has been reconciled to the canonical desktop model** — roles are now
> **Admin / Member**, the catalog set is **Groups / Units / Manufacturers** (no Departments), status
> keys are **`in-use` / `storage` / `repair` / `retired`**, and the `dept` field is gone (device rows
> show manufacturer/location, member rows show site). Bind it to the same `types/devicehub.ts` as the
> desktop — there is no longer a separate mobile data shape.

---

## Navigation — pick one (the mock asks you to choose)
The gallery's first section compares two bottom-bar patterns:
- **Option A · 4-tab:** Overview · Devices · Members · More, with a **floating + FAB** on the Devices
  screen to add a device.
- **Option B · 5-tab + center Add:** Overview · Devices · **(＋)** · Members · More — a raised center
  Add button. **Recommended / used by the rest of the gallery.** Build Option B.

Tabs: Overview (`layout-dashboard`) · Devices (`hard-drive`) · Members (`users`) · More (`menu`).
Active tab = primary color; inactive = muted.

## Screen inventory (`MOBILE.screens.*`)
| Screen | Notes |
|---|---|
| `login` | "Continue with Google" SSO button + managed-account note (mobile uses Google SSO framing) |
| `overview` | KPI cards (2-col), lifecycle bar + legend, inventory-by-group, needs-attention list |
| `devices` | search pill + filter chips (All/Group/Status/Dept) + device list rows (icon, name, code·dept, status badge + condition bar, chevron) |
| `deviceDetails` | hero (icon + name + code + badges), condition ring card, Identification dl, activity timeline |
| `createDevice` / `editDevice` | sectioned fields with a **sticky bottom action bar** (replaces the tab bar); edit adds a destructive delete |
| `members` | filter chips (All/Admins/Members) + member rows (avatar, name·site·role, role/status badge, chevron) |
| `memberProfile` | profile header + Details dl + **Permissions** capability list (5 rows) |
| `more` | account card + Catalog group (Departments/Groups/Manufacturers) + System (Settings/Sign out) |
| `units`/`groups`/`manufacturers` | catalog lists reached from More (count pill + arrow per row) |
| `settings` | appearance segmented (Light/Dark/System), inventory defaults, notification switches |

Chrome helpers: `MOBILE.tabbar(active, nav)` and a shared `head({title, sub, avatar, actions, back})`.
Styling tokens are the **same** `theme/tokens.css` (so dark mode + brand carry over); mobile-specific
classes live in `mobile/mobile.css` (prefix `mob-`).

## Build guidance
- Reuse the canonical components/types; the mobile layout is a **presentation** of the same data.
- The catalogs that are top-level "Catalog" nav on desktop live under the **More** tab on mobile.
- Already reconciled to the desktop model (roles, catalogs, status keys, no `dept`) — build against the same types.
- Capture set in `mobile/images/` covers each gallery screen + the two nav options + a dark example.
