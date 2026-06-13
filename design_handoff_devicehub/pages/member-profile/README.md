# Page — Member Profile

**Reference:** `reference_html/Member Profile.html` · **Route:** `/members/[email]` · **Nav:**
Members (active). **Access:** Admin (others' profiles); a user can always reach **their own** via the
user menu. **Data:** one `Member` resolved by the `email` URL param (mock falls back to first member).

---

## Purpose
The single-member view: identity + status, contact details, recent activity, and (for your own
profile) a security panel. Admins get the management action cluster.

## Layout
- Back link → `/members`.
- **Profile header** (`.dhead`): large round **avatar** (initials) · `name` (24/600, with **"You"**
  pill if self) · sub-row [`email` · sep · role badge · status badge] · right-aligned **action
  cluster** (varies by self vs admin — below).
- **`.cols`** grid `1fr 320px` (→ 1 col ≤1080):
  - **Left stack:** **Details** card; **Security** card (self only).
  - **Right rail:** **Recent activity** card.

## Sections & data mapping
| Section | Fields |
|---|---|
| Header | `name`, `email`, `role`→role badge, `status`→status badge, `you`→"You" pill |
| Details (`id-card`) | Phone→`phone` (mono) · Member since→`joined` (DD MMM YYYY) · Last active→`last` |
| Security (self only, `shield`) | copy + **"Sign out all sessions"** button |
| Recent activity (`history`) | timeline; **invited** members show only "Invitation sent · awaiting acceptance"; others show Signed in / Updated a device / Joined the workspace |

> The mock's `Member` here carries extra profile fields (`site`, `phone`, `manager`, `joined`) beyond
> the list row — they're in `types/devicehub.ts`.

## Action cluster (header) — by viewer
- **Own profile (self):** **Edit my profile** (primary) → `/profile`.
- **Admin viewing another:** **Edit** (outline → role dialog) · **Reset password** (outline →
  confirm) · **Activate/Deactivate** (outline, label/icon depend on status → confirm) · **Remove**
  (destructive → confirm → redirect `/members`).

## Interactive elements
| Element | Action |
|---|---|
| Back link | → `/members` |
| Edit my profile (self) | → `/profile` |
| Edit (admin) | open **role dialog** (email disabled, role select) → toast "Member updated" |
| Reset password | confirm "Reset password for {name}?" → toast "Reset link sent" |
| Activate/Deactivate | confirm → toggle `status`, re-render, toast |
| Remove | confirm "Remove {name}?" → toast "Member removed" → redirect `/members` |
| Sign out all sessions (self) | confirm (warn) "Sign out all sessions?" → redirect `/login` |

## Dialog — Edit role
Same shape as the Members invite/edit dialog (email disabled + hint hidden, role select). On save:
updates `role`, toasts "Member updated".

## States
- **Loading** (`states/Member Profile - Loading.html`): avatar + card skeletons.
- **Profile not found** (`images/01-state.png`): the `email` doesn't resolve (unknown or stale link).
  Icon `user-x` · title **"Profile not found"** · body **"We couldn't find that member. They may have
  been removed, or the link is out of date."** · action **Back to members**. Viewing another member's
  profile is fine; only **editing** another member is restricted (see `pages/profile/README.md`).

## Responsive
`.cols` → 1 col ≤1080 (activity drops below); header actions wrap; sidebar→drawer ≤980. See `images/`.

## Icons used
arrow-left, id-card, shield, history, pencil, key-round, user-check, user-x, user-minus, log-out,
mail, log-in, user-plus, shield-check, user.
