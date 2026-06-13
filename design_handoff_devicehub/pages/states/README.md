# State variants

DeviceHub ships explicit loading / empty / error / permission / validation / system-error screens.
These are reference files in `reference_html/states/` (each uses `<base href="../">` so it loads the
shared theme). Recreate with the helpers noted in `global/GLOBAL-SHELL.md` §"Shell helper → React".
Screenshots in `images/` (desktop `01-*`, mobile `02-*`).

| State | Belongs to | What it shows | Recreate with |
|---|---|---|---|
| `device-list-loading` | Device List | toolbar + skeleton table rows (`DH.sk.table`) | skeleton table component |
| `device-list-empty` | Device List | first-run zero devices, "Register your first device" CTA | empty component + primary CTA |
| `device-list-error` | Device List | `cloud-alert` icon, "Couldn't load…", **Try again** (`DH.errorState`) | error boundary / retry |
| `overview-loading` | Overview | KPI skeletons (`DH.sk.kpis`) + card skeletons | skeletons |
| `overview-empty` | Overview | brand-new workspace, KPIs read 0, register CTA | empty component |
| `members-loading` | Members | role-card skeletons + member-table skeleton | skeletons |
| `members-empty` | Members | first-run, invite CTA | empty component |
| `member-profile-loading` | Member Profile | avatar + card skeletons | skeletons |
| `create-device-validation` | Create Device | required fields with destructive borders + inline errors on submit | Zod + form errors |
| `permission-denied` | Members / any admin surface | locked card, role read-only, "Back to overview" + "Request access" (`DH.permissionDenied`) | route guard + denied component |
| `404` | global | not-found page (standalone, no shell) | `app/not-found.tsx` |
| `500` | global | server-error page (standalone, no shell) | `app/error.tsx` |
| `catalog-loading/empty/error` | Groups/Units/Manufacturers | skeleton table · "No groups yet" + create CTA · `cloud-alert` "Couldn't load groups" + Try again (`pages/catalogs/images/0N-state.png`) | skeleton / empty / error components |
| `device-details-loading/error` | Device Details | header+card skeletons · `DH.errorState` "Couldn't load this device" (`pages/device-details/images/0N-state.png`) | skeleton / error |
| `profile-loading` | My Profile | field/card skeletons (`pages/profile/images/01-state.png`) | skeleton |
| `profile-not-owner` | My Profile (edit) | **"can't edit this profile"** state shown for any non-own edit target — not-yours OR not-found (`pages/profile/images/02-state.png`) | route guard + denied component |
| `member-profile-not-found` | Member Profile (view) | unknown/stale email → `user-x` "Profile not found" + Back to members (`pages/member-profile/images/01-state.png`) | not-found component |
| `edit-device-loading` | Edit Device | header+section skeletons (`pages/create-edit-device/images/edit-state.png`) | skeleton |
| `login-error` | Login | inline "Incorrect email or password" banner + error-bordered field (`pages/auth/images/login-error.png`) | form error |

> Every UI now has a captured loading/empty/error/permission state where one is meaningful. Some are
> shared-helper states triggered on the live page (not bespoke files in `reference_html/states/`) —
> they're listed above with their image paths.

**Empty-state copy (exact):**
- Device List (filtered): "No devices match these filters" / "Try removing a filter or searching for
  something else." · (no devices): "No devices yet" / "Register your first device to start tracking
  the fleet."
- Members: "No members match" / "No one matches '{q}'. Try a different search or role filter."

**Toast copy** is documented per action in each page README. **Confirm copy** likewise (every
destructive action uses `DH.confirm` with an "Are you sure…?" body — see GLOBAL-SHELL §5).
