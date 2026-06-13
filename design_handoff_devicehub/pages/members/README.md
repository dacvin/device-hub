# Page — Members

**Reference:** `reference_html/Members.html` · **Route:** `/members` · **Nav group:** System.
**Access:** **Admin only** (Members hitting it via a Member role → permission-denied state).
**Data:** `Member[]` (see `types/devicehub.ts`).

---

## Purpose
Manage who has access to DeviceHub: see everyone, filter by role, invite new members, edit roles,
reset passwords, deactivate/activate, and remove — individually or in bulk.

## Layout
- **Topbar actions:** search ("Search members…") · Export · **Invite member** (primary, `user-plus`).
- **Role summary cards** (`#rolecards`, 2-up → 1 ≤880): one per role (Admin, Member) = role icon
  tile + **count** + role name + one-line description (from `ROLE_META`).
- **Toolbar:** segmented **role filter** [All / Admins / Members].
- **Meta line:** "`{n} members · {admins} admins · {pending} pending invite`".
- **Members table** (min-width 940, scrolls).

## Table columns & field mapping
| Column | Source field(s) | Render / combination |
|---|---|---|
| (lead) | — | selection checkbox |
| Member | `name` + `email` (+ `you`) | **link → `/members/[email]`**: avatar (initials on primary) + name (with a **"You"** pill when `you`) on line 1, `email` muted on line 2 |
| Role | `role` | `badge` (Admin=`badge-primary` shield-check, Member=`badge-secondary` user) |
| Last active | `last` | muted text ("Active now", "2 hours ago", "—") |
| Status | `status` | badge: active=`success` "Active" · invited=`warning` "Invited" · deactivated=`muted` "Deactivated" |
| (trail) | — | row actions, **revealed on row hover** |

## Row actions (hover-revealed)
- **Your own row (`you`):** only **Edit** (pencil) → `/profile`.
- **Others:** **Edit** (pencil → role dialog) · **Reset password** (key-round → confirm → toast) ·
  **Activate/Deactivate** (user-check / user-x → confirm) · **Remove** (user-minus, danger → confirm).

## Interactive elements
| Element | Action |
|---|---|
| Search | filter by name/email |
| Role segmented filter | filter list to All / Admin / Member |
| Invite member | open **invite dialog** (create mode) |
| Member row | → `/members/[email]` |
| Row Edit (self) | → `/profile` |
| Row Edit (other) | open **edit dialog** (role only) |
| Row Reset password | confirm "Reset password for {name}?" → toast "Reset link sent" |
| Row Activate/Deactivate | confirm → toggles `status`, toast |
| Row Remove | confirm "Remove {name}?" → removes, toast |
| Export | export members CSV |
| Bulk bar (≥1 selected) | **Role** (popover of roles → bulk set) · **Reset password** (confirm → toast) · **Deactivate** (sets status on non-self) · **Remove** (confirm → removes) |

## Dialog — Invite / Edit member (`#inviteDlg` → `<Dialog>`)
Single dialog, two modes:
- **Invite:** title "Invite member", desc "They'll get an email to join with the role you pick. Only
  admins can invite." Fields: **Work email** (input, hint "Must be an IT-managed @sioux.asia
  account") + **Role** select [Member/Admin]. Submit "Send invite" → toast "Invitation sent".
- **Edit:** title "Edit {name}", desc "Update this member's role. Email is managed by IT and can't be
  changed." Email field **disabled** + hint hidden; Role select prefilled. Submit "Save" → toast
  "Member updated" (notes whether the role actually changed).
Closes on Esc / overlay / Cancel.

## Dropdown — bulk Role picker
The bulk **Role** button opens a popover (`DH.popoverMenu`, head "Set role", opens **above** the bar)
listing each role; choosing one sets `role` on all selected and toasts "Role updated · N members set
to {role}."

## States
| State | File |
|---|---|
| Loading | `states/Members - Loading.html` (role-card skeletons + table skeleton) |
| Empty — filtered/search | in-page: "No members match" + "Reset filters" |
| Empty — first run | `states/Members - Empty (first run).html` |
| Permission denied (non-admin) | `states/Permission denied (Viewer).html` |

## Responsive
Role cards 2→1 ≤880; table scrolls; row actions become always-visible on touch (no hover) — surface
them via an overflow menu on mobile; sidebar→drawer ≤980. See `images/`.

## Icons used
search, download, user-plus, shield-check, user, pencil, key-round, user-check, user-x, user-minus,
user-cog, check, minus, x.
