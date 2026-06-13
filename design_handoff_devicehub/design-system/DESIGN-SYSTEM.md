# DeviceHub — Design System

Source of truth: `reference_html/theme/tokens.css` (tokens) + `reference_html/theme/components.css`
(component layer). The living visual reference is `reference_html/DeviceHub Theme.html` — open it.
A static capture of it is at `design-system/images/theme-reference.png` (palette, ramp, light/dark
tokens, type scale, and skinned components on one page).

> **Build approach:** this is a **green skin for shadcn/ui**. Copy `tokens.css` into your
> `globals.css` and use stock shadcn components; the tokens do all the re-coloring. Don't
> reimplement the CSS in `components.css` — it only exists so the static mockups look like shadcn.

---

## 1. Color tokens

All colors are authored in **oklch**. Copy `tokens.css` verbatim — below is the human-readable map.

### Brand green ramp (drives light theme)
| Token | Hex | Role |
|---|---|---|
| `--green-50` | `#F1FBF6` | lightest tint |
| `--green-100` | `#DCF5E8` | secondary / mint surface |
| `--green-200` | `#B9EBCF` | success badge bg |
| `--green-300` | `#6FCF97` | **palette** · dark-mode primary |
| `--green-400` | `#46BC8A` | |
| `--green-500` | `#36AE88` | condition/charts "good" |
| `--green-600` | `#2FA084` | **palette** · light primary |
| `--green-700` | `#277E69` | |
| `--green-800` | `#1F6F5F` | **palette** · secondary-fg, accessible fill |
| `--green-900` | `#1A5A4D` | success badge text |
| `--green-950` | `#103A33` | auth gradient base |

### Semantic tokens (light → dark)
| Token | Light | Dark |
|---|---|---|
| `--background` | `#FCFDFC` | `#121A18` |
| `--foreground` | `#16201D` | `#E8F0ED` |
| `--card` / `--popover` | `#FFFFFF` | `#18221F` |
| `--primary` | `#2FA084` | `#6FCF97` |
| `--primary-foreground` | `#FCFDFC` | `#121A18` |
| `--secondary` / `--accent` | `#DCF5E8` | `#243430` / `#2A3D37` |
| `--secondary-foreground` | `#1F6F5F` | `#E8F0ED` |
| `--muted` | `#F2F4F3` | `#1F2B28` |
| `--muted-foreground` | `#5B6B65` | `#9BB0A9` |
| `--border` / `--input` | `#E4E8E6` | `#2C3A36` |
| `--ring` | `#2FA084` | `#36AE88` (green-500) |
| `--destructive` | `oklch(0.577 0.245 27)` red | `oklch(0.704 0.191 22)` |
| charts `--chart-1..5` | green-600/300/800 + teal + sand | lightened equivalents |
| sidebar `--sidebar*` | green-50 surface | card surface |

Status/flag badge tones are computed from these (see §4 Badge).

---

## 2. Typography

- **Family:** `Geist` (sans) everywhere; `Geist Mono` for codes, serial numbers, IDs, support URLs, phone.
- **Scale (px):** 12 · 13 · 14 · 16 · 18 · 22 · 28. (No 20, no 24-bold — page titles are 22–24/600.)
- **Weights:** 400 body · 500 most labels/medium · 600 headings/emphasis · 700 rare.
- **Tracking:** headings use `-0.01em`/`-0.02em`. Tabular numerals (`font-variant-numeric: tabular-nums`)
  on all stat/condition/qty numbers.

| Role | Size / weight | Usage |
|---|---|---|
| Display | 28–30 / 600 | KPI values, auth H1, big stats |
| Page title | 22–24 / 600 | topbar title, detail H1 |
| Card/section title | 15–16 / 600 | card headers |
| Section eyebrow | 12–13 / 600, uppercase, `.04–.08em`, muted or primary | "IDENTIFICATION", group labels |
| Body | 14 / 400 | tables, forms, most UI |
| Label / secondary | 13 / 500 | field labels, nav |
| Caption / hint | 12 / 400, muted | helper text, timestamps |
| Mono | 12–13 | `DEV-2041-XPS`, `SN: 5KQ8R2` |

---

## 3. Spacing, radius, shadow, motion

- **Spacing:** 2 / 4 / 6 / 8 / 12 / 16 / 20 / 24 / 28 / 32. Card padding 22–24; grid gaps 16–20.
- **Radius:** `--radius` 0.625rem → `--radius-sm` (calc −4) `--radius-md` (−2, buttons/inputs)
  `--radius-lg` `--radius-xl` (+4, cards) · pills 9999px.
- **Shadows:** cards `0 1px 2px rgba(16,24,40,.04)`; popovers/menus `0 12px 32px rgba(16,24,40,.16)`;
  dialogs `0 20px 60px rgba(16,24,40,.28)`; toast similar to popover.
- **Focus ring:** `box-shadow: 0 0 0 3px color-mix(in oklch, var(--ring) 30–40%, transparent)` +
  border becomes `--ring`. This is the only ring in the system.
- **Motion:** color/border/shadow transitions **.12–.15s ease**. No transforms, no scale, no bounce.
  Skeleton shimmer 1.4s (disabled under `prefers-reduced-motion`). Dialog/toast fade + small translate.

---

## 4. Component inventory (with every state)

Each maps to a shadcn component (see README §3). States listed are what the mock implements.

### Button — `.btn` → `<Button>`
- **Variants:** `btn-primary` (solid green), `btn-secondary` (mint fill), `btn-outline` (card bg +
  border), `btn-ghost` (transparent), `btn-destructive` (red). `btn-icon` = square icon-only.
- **Sizes:** default h36 · `btn-sm` h32 · `btn-lg` h40.
- **States:** hover = **lighten/`--accent` fill** (outline/ghost) or mix-with-black 90% (primary/
  secondary/destructive); `:focus-visible` = ring; disabled (catalog "can't delete") = `.is-disabled`
  greyed + no pointer.
- Icon + label gap 8px; icons 16px.

### Card — `.card` → `<Card>`
White (`--card`), `--border` 1px, `--radius-xl`, soft shadow. Interactive cards (device tiles,
attention rows) hover → border `--ring` + slightly stronger shadow; **never lift/scale**.

### Input / Select / Textarea — → `<Input> <Select> <Textarea>`
h36, `--radius-md`, border `--input`. Focus → `--ring` border + 3px halo. Placeholder muted 70%.
Select has a custom chevron bg-image. Read-only field = muted fill + lock hint (Profile email).
Range slider uses `accent-color: var(--primary)` with a live `%` readout.

### Badge — `.badge` → `<Badge>`
h22, pill, 12/500, optional 6px leading `.dot`. Tones:
| Class | Light bg / text | Used for |
|---|---|---|
| `badge-success` | mint / green-900 | status **In use**, member **Active** |
| `badge-info` | sky tint | status **In storage** |
| `badge-warning` | amber | status **In repair**, flags, member **Invited** |
| `badge-muted` | muted | status **Retired**, member **Deactivated** |
| `badge-danger` | red tint | severe/faulty (rare) |
| `badge-primary` | green fill | Admin role, qty pill |
| `badge-secondary` | mint | group label, Member role |
| `badge-outline` | transparent + border | misc tags |
All tones have `.dark` variants. **Flag chips** are a badge variant with a leading lucide icon.

### Table — `.table` → `<Table>`
Header: 12/500 muted, h44, bottom border. Rows: h56 (compact h40), bottom border, hover `--muted`.
Selected row = `.row-selected` tint. Leading checkbox column + trailing actions column. Wide tables
scroll horizontally inside the card (`min-width` set). See Device List doc for column registry.

### Checkbox / header tri-state — `.checkbox`
16px, `--radius-sm`. `.checked` = primary fill + white check. Header checkbox supports
**indeterminate** (minus glyph) when some-but-not-all rows in view are selected.

### Tabs / Segmented — `.tabs`/`.seg` → `<Tabs>` / `<ToggleGroup>`
Pill track on `--muted`; active pill = `--card` fill + tiny shadow. Used for: Device-List
Table/Cards switch, Device-Details Details/Warranty/History, Members role filter, Create stepper,
Settings appearance.

### Switch — `.switch` → `<Switch>` · **Avatar** — `.avatar`
Switch 36×20, primary when on. Avatar circular, **initials on solid `--primary`** (white text) —
the signature fallback; image when uploaded.

### Status & flag helpers
- `DH.statusBadge(status)` → the right `badge-{tone}` + dot + label from `STATUS_META`.
- `DH.flagChips(device)` → derived flag chips (icon + label) from `deviceFlags()`; "—" when none.
- `DH.initials(name)` → 2-letter uppercase initials for avatars.

---

## 5. Icon set (lucide)

~70 icons, drawn 24×24 / stroke 2, colored `currentColor`. Notable mappings:
- **Nav:** layout-dashboard, hard-drive, layers, boxes, factory, users, menu.
- **Groups→icon:** Laptop=laptop, Desktop/Monitor=monitor, Printer=printer, Network=network,
  Server=server, Mobile=smartphone, Peripheral=webcam.
- **Status/flags:** circle-check-big, wrench, triangle-alert, shield-alert (warranty),
  calendar-clock (inventory), shield-check.
- **Actions:** plus, pencil, trash-2, download, upload, copy, printer, key-round, user-plus,
  user-minus, user-x, user-check, log-out, refresh-cw, sliders-horizontal, ellipsis,
  arrow-left/right, chevron-left/right/down, check, minus, x, search.
Each page doc lists its own icon usage. **Never** use unicode glyphs (→ × ✓) — always the SVG icon.
