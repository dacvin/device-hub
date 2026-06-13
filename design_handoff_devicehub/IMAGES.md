# Image conventions

Every `images/` folder holds high-res (PNG, `@2x`) captures. Files are number-prefixed; the order is:

## Page folders (`pages/*/images/`)
For each page, the breakpoint set comes first, then any sub-views (dialogs/dropdowns/alternate views):

| Prefix | Breakpoint | Notes |
|---|---|---|
| `01-<page>` | **Desktop** | full layout with sidebar (rendered at ~1320px, fit to frame) |
| `02-<page>` | **Tablet ~768px** | sidebar collapses to drawer, grids begin stacking |
| `03-<page>` | **Mobile ~390px** | full single-column mobile reflow |

Then sub-views under a separate base name, e.g. `pages/device-list/images/0N-view.png`:
- **device-list / view:** 01 Cards view · 02 Columns dropdown · 03 delete confirm · 04 select-all (bulk)
- **device-details:** 04 = "⋯ more" popover menu
- **create-device:** 04 = leave-without-saving confirm
- **edit-device:** 04 = delete confirm
- **catalogs / groups:** 04 = create dialog (icon picker)
- **members:** 04 = invite dialog
- **member-profile:** 04 = admin view (other member) · 05 = edit-role dialog

**State captures** (helper states triggered on the live page), as `0N-state.png` in the page folder:
- **catalogs:** 01 loading · 02 empty · 03 error
- **device-details:** 01 loading · 02 error
- **profile:** 01 loading · 02 permission-denied (editing another's profile)
- **member-profile:** `state.png` 01 = profile not found (viewing an unknown member)
- **create-edit-device:** `edit-state.png` = Edit Device loading skeleton
- **auth:** `login-error.png` = login error banner

## Auth (`pages/auth/images/`)
`01` desktop (both panes) · `02` mobile (form only). Forgot adds `03` = success/"check your email" stage.

## States (`pages/states/images/`)
`01-<state>` desktop · `02-<state>` mobile.

## Mobile (`mobile/images/`)
`gallery.png` 01–05 = the five gallery sections (Navigation compare · Core screens · Forms ·
Catalog & settings · Auth & dark mode), each a row of iOS phone mockups.

## Global (`global/images/`)
`user-menu.png` = the sidebar user-menu dropdown open.

> These are reference renders. The prototypes in `reference_html/` are fully responsive — open any
> page and resize the browser for a pixel-exact view at any width.
