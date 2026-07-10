# CLAUDE

Project-specific guidance. Generic shadcn/Tailwind how-to lives in the shadcn skill — this file only covers what's unique to this repo.

## UI stack

Tailwind CSS v4 + shadcn/ui (Radix, `radix-nova` style), Turbopack.

- Primitives: `src/components/ui/*` — vendored/CLI-generated, **don't hand-edit** (eslint relaxes strict rules there); add with `pnpm dlx shadcn@latest add <name>`. App-shared: `src/components/app/*`. Feature UI: `src/features/<f>/components/*`.
- **Design tokens** (`src/app/globals.css`) — the "Instrument Console" system: deep-ink sidebar `--sidebar #0e1626` (fixed in both modes), light canvas, teal `--primary #0d9488`, fixed `--status-{in-use,storage,repair,retired}` (+ `-soft`), full dark variant. Use tokens (`bg-primary`, `bg-status-*`), never raw hex. Codes/counts/metrics: `font-mono tabular-nums`.
- Conditional classes: `cn()` with `cond && 'x'` / `{ 'x': cond }` — never ternary/concat.
- Theme: next-themes Light/Dark/System (default light). i18n: next-intl EN/VI — every string from `messages/*.json`. Icons: `lucide-react`. Toasts: `sonner`.

## Forms

TanStack Form + shadcn `Field` + zod v4, no adapter — follow `ui.shadcn.com/docs/forms/tanstack-form` exactly. Zod messages are i18n keys; render with `@/lib/form/field-error`, not the bare shadcn `FieldError`. Schemas in `features/<f>/validations/*`. FK typeahead = `command`+`popover` combobox (`device-fk-field.tsx`).

## API layer

Typed Supabase client + generated `database.types`, hand-written zod, camel/snake boundary via `camelcase-keys`. Per feature a root `getXxxQueryOptions()` owns the bare key (`['devices']`); other queries build on `().queryKey` and mutations invalidate it — no exported key constants. Examples: `features/devices/api`.

On-demand reference docs (read when relevant):

| When | Read |
|------|------|
| Query keys / mutations / infinite query | `.claude/reference/api-layer.md`, `.claude/reference/api/*` |
| Feature / folder layout | `.claude/reference/project-structure.md` |

## Validate before done

`pnpm lint:fix` → `pnpm build` → `pnpm run format:fix`. On failure, fix and re-run from the start.
