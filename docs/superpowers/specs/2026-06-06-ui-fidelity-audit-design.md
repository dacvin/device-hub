# UI Fidelity Audit & Fix

**Date:** 2026-06-06
**Status:** Draft — awaiting user review

## Goal

Bring every built screen in `client/` to pixel-fidelity with its corresponding mock in `design_handoff_devicehub/`. Fidelity means the same dimensions, paddings, gaps, radii, font sizes/weights, colors, hover/active states, and component composition that the mock specifies. The mock HTML and its linked `theme/*.css` are the source of truth — not the screenshots.

## In scope

- Login (`Login.html`)
- App shell — sidebar + topbar (used by every internal page)
- Device List (`Device List.html`) — table + cards + filters + Columns dropdown
- Device Details (`Device Details.html`)
- Create Device (`Create Device.html`)
- Edit Device (`Edit Device.html`)
- Departments, Groups, Manufacturers (`Departments.html`, `Groups.html`, `Manufacturers.html`)

## Non-goals

- No new features, no schema changes, no copy rewrites, no i18n rework.
- No design-token edits. `client/src/app/globals.css` already matches `design_handoff_devicehub/theme/tokens.css` to numeric precision (only comment differences) — that foundation stays put.
- Do not port the mock's vanilla-CSS shadcn simulation (`theme/components.css`, `theme/shell.css`) into the app verbatim. Use the real shadcn primitives with the values the mock implies.

## Sequence

Foundation pages first, because everything sits on the shell.

1. App shell — sidebar + topbar
2. Login (standalone, no shell)
3. Device List
4. Device Details
5. Create Device
6. Edit Device (mostly a Create delta)
7. Departments
8. Groups
9. Manufacturers

Each page ships as its own commit so progress is visible and the work can pause/resume between any two. The three catalog pages share the same shell, so their gap reports will overlap heavily; the plan should consolidate shared fixes into the first catalog page (Departments) and treat the other two as deltas.

## Audit methodology

**Source files to read for every page:**

1. The page HTML (e.g., `design_handoff_devicehub/Device List.html`) — markup, class names, inline component composition.
2. `design_handoff_devicehub/theme/components.css` — the per-component rules (`.badge-*`, `.button-*`, `.table-*`, …) that the mock's classes resolve to.
3. `design_handoff_devicehub/theme/shell.css` — sidebar/topbar dimensions when the page uses the shell.

Read the actual CSS rules, not the rendered screenshot. When the mock says `padding: 14px 16px`, record `14px 16px`. Approximations like "~16px" are not acceptable in the gap report — follow the class chain until it resolves to a number. If a value is genuinely unclear, flag the row as `unresolved` in the gap report instead of guessing.

**Per-region comparison.** For each visible region of the built page, locate the matching block in the mock and extract its computed style (dimensions, spacing, typography, color tokens, radii, shadows, transitions, hover/active deltas). Then read the built component (file + line) and diff.

**Gap-report format — one table per page, inside the implementation plan:**

| Region | Mock value (file:line) | Built value (file:line) | Fix |
|---|---|---|---|
| Sidebar width | `248px` (shell.css:12) | `w-64` = 256px (sidebar.tsx:18) | Change to `w-[248px]` |
| Table row height | `56px` (components.css:84) | default ≈ 48px (device-table.tsx:42) | Add `h-14` on `TableRow` |

Rows only get added when there is a measurable gap. "Matches" entries are omitted to keep the report scannable. Tokens already validated as in-sync (`--background`, `--primary`, `--border`, …) are not re-listed per page — they belong to the foundation.

The spec itself does not contain the filled-in tables. The audit runs *inside the implementation plan* (writing-plans next). This spec defines the format and what counts as a gap.

## Per-page fix loop

For each page in the sequence:

1. **Read the mock.** Open the HTML + `components.css` + `shell.css`. Extract numbers into the page's gap-report table (Region · Mock value · Built value · Fix). Cite mock file:line for every value.
2. **Read the built page.** Open the route + its `_components/*`. Locate each region; record current value + file:line.
3. **Resolve gaps in Tailwind.** Prefer named tokens (`px-4`, `gap-2`, `rounded-xl`, `bg-card`) when they match exactly; fall back to arbitrary values (`h-[56px]`, `w-[248px]`) only when no token matches. Never inline literal hex colors — use the semantic token from `globals.css`.
4. **Run the dev server and look.** `pnpm dev`, open the page in a browser, compare side-by-side with the mock HTML (also opened in a browser). Spot-check the fixed values.
5. **Subagent verification.** Dispatch an `Explore`-style subagent with the mock file paths, the built component paths, and the gap-report table. The subagent's job is to independently re-read both sides and confirm every row's Built value now matches the Mock value (light + dark, plus the page's responsive breakpoints). If it flags discrepancies, fix them in the same page before committing. Self-reported "done" is not sufficient.
6. **Commit.** One commit per page. Message format: `fix(ui): match <page> to mock`.

## Verification

A gap is closed when the built CSS computed value matches the mock CSS value — same number, same unit, same token. When the mock uses a vanilla-CSS class that the real shadcn component doesn't expose (e.g., the mock's `.table` has custom row padding), replicate the value via the shadcn component's API or a wrapping class — not by porting the mock's CSS file.

**Light/dark parity.** Each page is checked in both modes before commit; the theme toggle in the topbar makes this one click. Tokens already carry both modes, so this is usually free. The failure mode to watch for is hardcoded colors leaking in.

**Responsive.** Breakpoints come from the mock README:
- sidebar hides < 980px
- details collapses to one column < 1080px
- create form section nav hides < 1000px
- login art hides < 880px

The audit records these per page; the fix applies them. We do not invent new breakpoints.

## Guardrails

- No new components, no new dependencies, no token edits.
- No "drive-by" cleanups in adjacent files — surgical changes only (CLAUDE.md §3).
- If a gap's fix would require restructuring a built component significantly (≈ 50+ lines changed in one file), flag it in the gap-report row as `needs-review` rather than silently expanding scope. The user decides whether to fix or defer.
- Stop after each page's commit and re-confirm before starting the next, so divergence is caught early.

## Done criteria

- All nine pages have a closed gap-report table (every row's Built value matches the Mock value, or is explicitly marked `needs-review`/`unresolved` with the user's sign-off).
- Each page has its own commit.
- App builds, passes typecheck and lint.
- Light + dark verified per page.

## Risks & open questions

- **Shadcn component limits.** A few mock values (e.g., custom row paddings, specific badge sizes) may not be reachable via shadcn's default API. The fix loop will surface these per row; the spec assumes className overrides will be enough. If a component needs to be wrapped or replaced, that becomes a `needs-review` row, not a silent rewrite.
- **Scope of the audit per page.** "Every region" is wide. The plan should bound the audit by the regions named in `design_handoff_devicehub/README.md` per page — that's already a detailed enumeration. Anything outside those regions stays out of the audit unless the user adds it.
- **i18n strings.** Recent commits translated several UI strings. The audit must not regress any of those — only adjust dimensions/styles, never copy.
