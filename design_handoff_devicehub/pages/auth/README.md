# Pages — Auth: Sign in & Reset password

**References:** `reference_html/Login.html` (route `/login`), `Forgot Password.html`
(route `/forgot-password`). **No app shell** — these are full-bleed, pre-auth pages.

---

## Shared layout
A **split screen** `grid-template-columns: 1fr 1fr`, min-height 100vh:
- **Left — form pane** (`.pane-form`, padding 40/56): brand wordmark top-left; centered form column
  (max-width 360); footer "© 2026 Sioux Asia · DeviceHub · IT Operations".
- **Right — art pane** (`.pane-art`): deep-pine gradient (`#277E69 → #1F6F5F → #103A33`), a faint
  grid-motif overlay + soft blobs, an eyebrow "Sioux Asia · IT Operations", a big headline with one
  word in mint (`em` → green-300), plus supporting content (see each page).
- **≤880px:** the art pane is **hidden**; the form pane goes single-column with reduced padding.

The art pane is pure CSS — no image asset. The wordmark is live type (no logo SVG).

---

## Sign in (`/login`)
- **Heading:** "Sign in" + sub "Welcome back. Sign in with your Sioux work email to access the device
  inventory."
- **Form:** Work email (prefilled `vinh.huynh@gmail.com` in mock) · Password (with **"Forgot
  password?"** link → `/forgot-password`) · **"Keep me signed in"** checkbox (custom, toggles) ·
  **Sign in** button (h44).
- **Managed notice** (mint panel, `shield-check`): "Access is limited to IT-managed @gmail.com
  accounts. All device activity is logged for audit."
- **Legal** line with acceptable-use link.
- **Art pane:** headline "Every device, *accounted for.*"; capability chips (Laptops/Monitors/
  Servers/Printers); stat row (1,284 tracked · 8 groups · 98.2% accuracy).
- **Behavior:** submit → `/` (Overview). Wire to real auth (the mock does no validation). Restrict to
  `@gmail.com`.

## Reset password (`/forgot-password`)
- **Back to sign in** link → `/login`.
- **Stage 1 — request:** "Forgot password?" + sub; Work email field; **Send reset link** button
  (`mail`); legal "Reset links expire after 30 minutes…".
- **Stage 2 — success** (toggled by `body.is-sent`): `mail-check` tile + "Check your email" + "We
  sent a password reset link to **{email}**…"; **Back to sign in** (primary) + a **Resend link**
  button with a **30-second cooldown** ("Resend in Ns", disabled until 0).
- **Art pane:** headline "Back in, *in three steps.*" + a 3-step list + "Links are single-use and
  expire in 30 minutes."
- **Behavior:** submit with empty email → red border + focus; otherwise show the success stage and
  start the cooldown. Recreate the two stages as component state.

## Interactive elements
| Element | Action |
|---|---|
| Forgot password? | → `/forgot-password` |
| Keep me signed in | toggle checkbox |
| Sign in | authenticate → `/` |
| Back to sign in | → `/login` |
| Send reset link | validate email → success stage + cooldown |
| Resend link | restart 30s cooldown (disabled during) |

## States
Login: invalid-credentials error (wire to real auth — not in mock). Forgot: empty-email inline error;
success stage. No `states/` files for auth.

## Responsive
Art pane hidden ≤880; form padding shrinks. See `images/` (both panes at wide; single-column at ≤880).

## Icons used
hard-drive, shield-check, laptop, monitor, server, printer, arrow-left, mail, mail-check, check.
