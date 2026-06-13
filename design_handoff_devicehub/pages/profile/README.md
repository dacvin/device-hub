# Page — My Profile (own account)

**Reference:** `reference_html/Profile.html` · **Route:** `/profile` · **Reached from:** user menu →
"View profile"/"Edit my profile", or your own row on Members. **Access:** the signed-in user.
**Data:** the current user's `Member` + a password-change form.

---

## Purpose
Edit your own account: name/phone/photo, see your IT-managed email and role, and change your password.

## Layout
Single centered column, max-width 820. Two stacked cards: **Personal information**, then **Change
password**.

## Sections & data mapping
### Personal information (`id-card`)
- **Photo row:** avatar (image or initials) + name + "PNG or JPG, up to 2 MB." + **Upload photo** /
  **Remove** buttons. Uploading previews immediately and toasts "Photo updated · Don't forget to save".
- **Fields (`fgrid` 2-col):**
  - Full name → `name` (text; **live-updates** the preview name + initials avatar as you type)
  - Work email → `email` (**read-only** muted field + lock hint "Managed by IT — contact an admin to change")
  - Role → `role` (select; informational — real role changes are admin-driven)
  - Phone → `phone` (text, mono)
- **Action bar:** Discard (ghost, reloads) · **Save** (primary → toast "Profile saved").

### Change password (`lock`)
Current password · New password ("At least 8 characters") · Confirm new password. **Update** button
validates (behavior → Zod):
- all three required → else error toast "Fill in all fields"
- new ≥ 8 chars → else "Password too short"
- new === confirm → else "Passwords don't match"
On success: clears the fields + toast "Password updated".

## Interactive elements
| Element | Action |
|---|---|
| Upload photo | file picker → preview + toast |
| Remove | reset avatar to initials |
| Full name input | live preview of name + initials |
| Discard | reload (revert) |
| Save | toast "Profile saved" |
| Update (password) | validate → toasts (error or success) |

## States
- **Loading** (`images/01-state.png`): field/card skeletons while the account loads.
- **Editing a profile that isn't yours → permission denied** (`images/02-state.png`): `/profile` is
  **always** the signed-in user's own account. If navigation ever resolves to *another* member's
  profile-edit (a deep link, a shared URL, or a non-admin reaching an edit route), do **not** render
  the form — show a locked state instead:
  - icon `lock` (warn tone) · title **"You can't edit this profile"** · body **"You can only edit your
    own profile. Updating another member's details is limited to IT Admins — open them from Members
    instead."** · actions **Back to members** (→ `/members`) + **View their profile** (→ the read-only
    member profile).
  - Admins edit *other* members through the **role dialog on Member Profile**, never through this
    page — there is no full edit-form for someone else. Enforce ownership on the route/server, not
    just the UI.
  - **One state covers both cases:** whether the edit target simply isn't you *or* doesn't exist, the
    edit route shows this same "You can't edit this profile" state — it does **not** distinguish a
    not-found target from a not-yours one. (The separate **"Profile not found"** state applies only to
    *viewing* a member — see `pages/member-profile/README.md`.)

## Responsive
`fgrid` → 1 col ≤640; column already capped at 820 and centers; sidebar→drawer ≤980. See `images/`.

## Icons used
id-card, upload, mail, lock.
