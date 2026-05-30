# device-hub — Project Initialization Design

**Date:** 2026-05-30
**Status:** Approved (pending user review of written spec)
**Owner:** Vinh Huynh

## 1. Purpose

Initialize `device-hub`, an internal application for the IT department to manage devices. This spec covers project scaffolding only: directory layout, init commands, dependencies, and mandatory boilerplate. Domain features (schema, auth flow, device management UI) are deferred until designs and schema are provided.

## 2. Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js (App Router, TypeScript, Turbopack) |
| Backend | Supabase (Postgres, Auth) — local CLI workspace |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui |
| Data fetching | TanStack Query |
| Forms | TanStack Form |
| Validation | Zod |
| Package manager | pnpm |
| Project structure | Bulletproof React (Next.js variant) |

Constraint: scaffolding must use **only official commands and boilerplate** from create-next-app, the Supabase CLI, shadcn, and the Supabase / TanStack Query documentation. No hand-authored boilerplate beyond what those sources prescribe.

## 3. Repository layout

```
device-hub/
├── client/                       # Next.js app (created by `pnpm create next-app`)
│   ├── src/
│   │   ├── app/                  # Next.js App Router (created by create-next-app)
│   │   ├── middleware.ts         # Supabase SSR session refresh (Next.js src/ convention)
│   │   ├── assets/               # Static files (images, fonts) — shared
│   │   ├── components/           # Shared UI; shadcn primitives land in components/ui/
│   │   ├── config/               # Global config + exported env vars
│   │   ├── features/             # Feature-scoped modules (see §4)
│   │   ├── hooks/                # Shared hooks
│   │   ├── lib/                  # Preconfigured third-party clients (supabase, react-query)
│   │   ├── stores/               # Global state stores
│   │   ├── testing/              # Test utilities and mocks
│   │   ├── types/                # Shared TS types (incl. generated Supabase types)
│   │   └── utils/                # Shared utility functions
│   ├── components.json           # shadcn config (created by `shadcn init`)
│   ├── next.config.ts            # Created by create-next-app
│   ├── tailwind.config.ts        # Created by create-next-app
│   ├── tsconfig.json             # Created by create-next-app
│   ├── eslint.config.mjs         # Created by create-next-app
│   ├── package.json
│   └── .env.local.example        # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── supabase/                     # Created by `supabase init`
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── docs/
│   └── superpowers/specs/        # Design specs (this file lives here)
├── CLAUDE.md
└── README.md
```

This matches the directory inventory documented at
`alan2207/bulletproof-react/docs/project-structure.md`. The `app/` folder
is the Next.js App Router (Bulletproof React explicitly notes that the
`app` directory varies per meta framework).

## 4. Per-feature structure

Each module under `src/features/<feature-name>/` follows the Bulletproof React per-feature convention:

```
src/features/<feature-name>/
├── api/         # API request declarations + feature-specific hooks (TanStack Query)
├── assets/      # Static files specific to the feature
├── components/  # Components scoped to the feature
├── hooks/       # Hooks scoped to the feature
├── stores/      # State stores for the feature
├── types/       # Types used within the feature
└── utils/       # Utility functions specific to the feature
```

Subfolders are created on demand per feature — no empty feature directories are pre-seeded.

## 5. Initialization sequence

All commands are official and idempotent. Run from repo root unless noted.

```bash
# 1. Next.js app — answer prompts:
#    TypeScript: Yes · ESLint: Yes · Tailwind: Yes · src/: Yes
#    App Router: Yes · Turbopack: Yes · import alias: @/*
pnpm create next-app@latest client

# 2. Supabase CLI workspace
pnpm dlx supabase init

# 3. shadcn (run inside client/)
cd client && pnpm dlx shadcn@latest init

# 4. Runtime dependencies
pnpm add @supabase/supabase-js @supabase/ssr \
         @tanstack/react-query @tanstack/react-form zod

# 5. Dev dependencies
pnpm add -D @tanstack/react-query-devtools supabase

# 6. Bulletproof React empty folders (from §3)
mkdir -p src/{assets,components,config,features,hooks,lib,stores,testing,types,utils}
```

`create-next-app` already creates `src/app/`, so it is omitted from `mkdir`.

## 6. Mandatory boilerplate (copied from official docs)

Two pieces of setup are unavoidable for any Next.js + Supabase + TanStack Query app. Both are copied verbatim from official documentation — not hand-written.

### 6.1 Supabase SSR clients
Source: <https://supabase.com/docs/guides/auth/server-side/nextjs>

Files created:
- `client/src/lib/supabase/client.ts` — browser client (`createBrowserClient`)
- `client/src/lib/supabase/server.ts` — server client (`createServerClient` + cookies)
- `client/src/lib/supabase/middleware.ts` — session-refresh helper
- `client/src/middleware.ts` — Next.js middleware entry that calls the helper (src/ convention)
- `client/.env.local.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 6.2 TanStack Query provider
Source: <https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr>

Files created:
- `client/src/lib/react-query.tsx` — `QueryClientProvider` + `HydrationBoundary` setup using the App Router pattern (per-request `QueryClient` via `cache()` on the server, singleton on the client)
- `client/src/app/layout.tsx` — wrap `{children}` with the provider (edit, not create)

Devtools (`@tanstack/react-query-devtools`) are mounted inside the provider in dev only.

## 7. Out of scope (deferred)

The following are intentionally **not** part of initialization. They are tracked here so they are not forgotten:

- Database schema (tables, types, relations) — user will provide
- RLS policies and seed data
- Authentication flow (email/password vs OAuth vs SSO) and auth UI
- Application routes and pages beyond what `create-next-app` generates
- Domain features under `src/features/`
- Component styling decisions and shadcn component selection
- Testing framework (Vitest / Playwright) — added when first test is written
- CI/CD and deployment target (Vercel vs self-host)
- Supabase TypeScript type generation (`supabase gen types typescript`) — added once the schema exists

## 8. Verification (definition of done for init)

The initialization is complete when all of the following hold:

1. `pnpm install` in `client/` succeeds with no errors.
2. `pnpm dev` starts the Next.js dev server and the default landing page renders.
3. `pnpm dlx supabase start` (optional, requires Docker) brings up the local stack.
4. `client/src/` contains the exact set of folders listed in §3.
5. `client/components.json` exists (shadcn init succeeded).
6. The TanStack Query provider wraps the root layout and the React Query Devtools panel is visible in dev.
7. The Supabase SSR client helpers exist under `client/src/lib/supabase/` and `client/middleware.ts` is in place.
8. `.env.local.example` documents the two required Supabase environment variables.
9. No domain code (features, routes beyond default, schema, components beyond shadcn defaults) has been added.

## 9. References

- Bulletproof React project structure: <https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md>
- Next.js installation: <https://nextjs.org/docs/app/getting-started/installation>
- Supabase + Next.js Server-Side Auth: <https://supabase.com/docs/guides/auth/server-side/nextjs>
- Supabase CLI local development: <https://supabase.com/docs/guides/local-development/cli/getting-started>
- shadcn/ui installation: <https://ui.shadcn.com/docs/installation/next>
- TanStack Query SSR with Next.js App Router: <https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr>
- TanStack Form: <https://tanstack.com/form/latest/docs/framework/react/quick-start>
- Zod: <https://zod.dev>
