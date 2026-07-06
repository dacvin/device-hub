# device-hub — Frontend + Supabase Scaffold Design

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan

## Goal

Stand up a clean, correctly-wired project skeleton: a Next.js App Router frontend
in `client/` and Supabase CLI config in `supabase/`. No product features yet — just
a running skeleton with the agreed stack integrated. Auth UI, DB schema, and edge
functions are explicitly deferred.

## Guiding constraint: official sources only

Every setup command and config is taken from the official docs of each tool —
`create-next-app`, `supabase init`, shadcn `init`, next-intl, TanStack Query/Form,
`@supabase/ssr`. Nothing is hand-authored or invented. Exact current commands and
versions are fetched from official docs at planning/implementation time, not from
memory.

## 1. Repo layout (top level)

```
device-hub/
  client/      # Next.js App Router app — self-contained (own package.json, pnpm)
  supabase/    # Supabase CLI config (supabase init output)
  CLAUDE.md, README.md, docs/
```

No root workspace / monorepo tooling. `supabase/` is CLI config, not a JS package.
Package manager: **pnpm**.

## 2. Stack & responsibilities

| Concern | Tool |
|---|---|
| Framework / routing | Next.js App Router (file-based) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Server state (data fetching/cache) | TanStack Query |
| Client/UI state (lazy) | Zustand |
| Forms | TanStack Form |
| Validation | Zod (shared by forms + API boundaries) |
| i18n | next-intl, no URL locale, cookie-persisted |
| Backend | Supabase (`@supabase/ssr` + `supabase-js`) |

**Boundaries:**
- TanStack Query owns all server data; it is never mirrored into Zustand.
- next-intl owns locale.
- Zustand holds only client/UI state, and stores are added per-need (YAGNI), not speculatively.

## 3. Frontend folder structure (Bulletproof React, App Router variant)

Bulletproof React's feature-based structure, adapted so `src/app/` is Next's
file-based routing directory (it fills Bulletproof's "application layer" role);
all other layers sit alongside under `src/`.

```
client/src/
  app/         # Next routing layer: layouts, pages, providers mount, middleware entry
  components/  # shared components (incl. components/ui from shadcn)
  config/      # env access, global config
  features/    # feature modules: api/ components/ hooks/ stores/ types/ utils/
  hooks/       # shared hooks
  lib/         # preconfigured libs: react-query client, supabase clients, i18n, zustand helpers
  stores/      # global zustand stores (only when needed)
  types/       # shared types (incl. generated supabase DB types later)
  utils/       # shared utils
  testing/     # test utils/mocks (scaffold only)
```

Unidirectional flow: shared → features → app. No cross-feature imports.
Enforceable via ESLint later (ESLint/Prettier config to be provided by the user).
A feature folder includes only the subfolders it needs.

## 4. Integration wiring (what gets created)

- **Providers:** a client `Providers` component wrapping `QueryClientProvider`
  (TanStack Query) + `NextIntlClientProvider`, mounted in `app/layout.tsx`.
- **next-intl:** "without i18n routing" setup — `getRequestConfig` reads locale from
  a `NEXT_LOCALE` cookie with a default fallback locale; messages in
  `client/messages/{locale}.json`; a server action switches locale (writes cookie +
  `router.refresh()`). No `[locale]` route segments.
- **Supabase:** `lib/supabase/client.ts` (browser) + `lib/supabase/server.ts` (server)
  factories per the official `@supabase/ssr` guide, plus `middleware.ts` that refreshes
  the auth session. No login pages, no schema.
- **shadcn:** `init` only, plus one trivial component (e.g. `button`) to prove the
  pipeline. Tailwind configured via the official `create-next-app` + shadcn `init` output.

## 5. Out of scope (YAGNI)

No auth/login UI, no DB schema or migrations, no edge functions, no monorepo tooling,
no ESLint/Prettier changes (awaiting the user's config), no CI. Just a running,
correctly-wired skeleton.

## 6. Success criteria

- `pnpm dev` in `client/` boots a Next App Router app with no errors.
- A shadcn component renders with Tailwind styling.
- Locale switch (server action) flips UI language via cookie, with no URL change.
- Supabase browser + server clients import cleanly; `middleware.ts` compiles.
- `supabase/` is initialized; `supabase start` works locally (Docker).
- Every command used is traceable to an official doc.
