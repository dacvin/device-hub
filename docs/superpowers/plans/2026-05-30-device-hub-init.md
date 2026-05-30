# device-hub Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `device-hub` repository with a Next.js + Supabase + shadcn/Tailwind + TanStack Query/Form + Zod stack organized per the Bulletproof React directory convention, using only official CLI commands and documented boilerplate.

**Architecture:** Two siblings at the repo root: `client/` (Next.js App Router app) and `supabase/` (Supabase CLI workspace). Inside `client/src/` we lay out Bulletproof React's documented folders. We wire two pieces of mandatory boilerplate from official docs: Supabase SSR cookie-based auth clients, and TanStack Query's App Router provider pattern. No domain code, schema, routes, or UI components are added — those wait for the user's designs.

**Tech Stack:** Next.js 15 (App Router, TypeScript, Turbopack), Supabase CLI + `@supabase/ssr`, shadcn/ui, Tailwind CSS, TanStack Query, TanStack Form, Zod, pnpm.

**Reference spec:** `docs/superpowers/specs/2026-05-30-device-hub-init-design.md`

**Note on official boilerplate:** Tasks 9–12 embed snippets from the @supabase/ssr Next.js guide and the TanStack Query Advanced SSR guide. Before pasting, the implementer SHOULD open the cited URL and copy whatever the docs show today — the snippets here are the canonical form but may have drifted slightly.

---

## File Inventory

**Created by official tooling (not authored by us):**
- `client/` — entire Next.js scaffold (via `pnpm create next-app@latest client`)
- `client/components.json` + `client/src/lib/utils.ts` + `client/src/components/ui/` — via `shadcn init`
- `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql` — via `supabase init`

**Created by us (only plumbing + documented boilerplate):**
- `client/src/lib/supabase/client.ts`
- `client/src/lib/supabase/server.ts`
- `client/src/lib/supabase/middleware.ts`
- `client/src/middleware.ts`
- `client/.env.local.example`
- `client/src/lib/react-query/get-query-client.ts`
- `client/src/lib/react-query/providers.tsx`
- Empty Bulletproof React folders under `client/src/`: `assets/`, `config/`, `features/`, `hooks/`, `stores/`, `testing/`, `types/`, `utils/` (each contains a `.gitkeep`)

**Modified by us:**
- `client/src/app/layout.tsx` — wrap `{children}` with the React Query provider

---

## Task 1: Scaffold the Next.js app

**Files:**
- Create: `client/` (entire directory tree, by official CLI)

- [ ] **Step 1: Confirm clean working directory**

Run:
```bash
git status
```
Expected: working tree clean on `main`.

- [ ] **Step 2: Run create-next-app**

The command is interactive. Answer the prompts as follows:

| Prompt | Answer |
| --- | --- |
| Would you like to use TypeScript? | Yes |
| Would you like to use ESLint? | Yes |
| Would you like to use Tailwind CSS? | Yes |
| Would you like your code inside a `src/` directory? | Yes |
| Would you like to use App Router? | Yes |
| Would you like to use Turbopack? | Yes |
| Would you like to customize the import alias (`@/*`)? | No |

Run:
```bash
pnpm create next-app@latest client
```

If `pnpm` non-interactively requires flags:
```bash
pnpm create next-app@latest client --typescript --eslint --tailwind --src-dir --app --turbopack --import-alias "@/*" --use-pnpm
```

Expected: a new `client/` directory containing `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`, and `src/app/{layout.tsx,page.tsx,globals.css}`.

- [ ] **Step 3: Verify Next.js installs cleanly**

Run:
```bash
cd client && pnpm install
```
Expected: install succeeds with no errors. `pnpm-lock.yaml` exists.

- [ ] **Step 4: Verify the dev server boots**

Run (from `client/`):
```bash
pnpm dev
```
Wait for: `✓ Ready in <N>ms` and `Local: http://localhost:3000`. Visit `http://localhost:3000` in a browser — the default Next.js landing page should render. Then stop the server (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
cd ..
git add client/
git commit -m "chore: scaffold client/ with create-next-app (Next.js App Router, TS, Tailwind, pnpm)"
```

---

## Task 2: Initialize the Supabase CLI workspace

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql`, `supabase/.gitignore` (all by `supabase init`)

- [ ] **Step 1: Run supabase init at repo root**

From the repo root:
```bash
pnpm dlx supabase init
```

When prompted "Generate VS Code settings for Deno?" answer **No**. When prompted "Generate IntelliJ Settings for Deno?" answer **No**.

Expected: a new `supabase/` directory at the repo root containing at least `config.toml` and an empty `migrations/` folder.

- [ ] **Step 2: Verify the layout**

Run:
```bash
ls supabase/
```
Expected output includes `config.toml` and `migrations`.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "chore: initialize supabase CLI workspace"
```

---

## Task 3: Initialize shadcn/ui

**Files:**
- Create: `client/components.json`, `client/src/lib/utils.ts`, `client/src/app/globals.css` (updated by shadcn), `client/src/components/ui/` (empty)

- [ ] **Step 1: Run shadcn init inside client/**

```bash
cd client && pnpm dlx shadcn@latest init
```

Answer the prompts as follows (defaults are fine but be explicit):

| Prompt | Answer |
| --- | --- |
| Which style would you like to use? | New York |
| Which color would you like to use as the base color? | Neutral |
| Do you want to use CSS variables for theming? | Yes |

Expected: `client/components.json` exists, `client/src/lib/utils.ts` exists with a `cn()` helper, `client/src/app/globals.css` updated with CSS variables, `client/src/components/ui/` directory created (likely empty).

- [ ] **Step 2: Verify shadcn config**

Run (from `client/`):
```bash
cat components.json
```
Expected: JSON with `style`, `tailwind`, `aliases`, `iconLibrary` keys.

- [ ] **Step 3: Commit**

```bash
cd ..
git add client/
git commit -m "chore: initialize shadcn/ui (New York style, Neutral base, CSS variables)"
```

---

## Task 4: Install runtime dependencies

**Files:**
- Modify: `client/package.json`, `client/pnpm-lock.yaml`

- [ ] **Step 1: Install Supabase, TanStack, and Zod packages**

From `client/`:
```bash
pnpm add @supabase/supabase-js @supabase/ssr @tanstack/react-query @tanstack/react-form zod
```
Expected: each package appears under `dependencies` in `client/package.json`.

- [ ] **Step 2: Verify versions**

Run (from `client/`):
```bash
pnpm ls @supabase/supabase-js @supabase/ssr @tanstack/react-query @tanstack/react-form zod
```
Expected: all five packages listed with resolved versions.

- [ ] **Step 3: Commit**

```bash
cd ..
git add client/package.json client/pnpm-lock.yaml
git commit -m "chore: add Supabase, TanStack Query/Form, Zod"
```

---

## Task 5: Install dev dependencies

**Files:**
- Modify: `client/package.json`, `client/pnpm-lock.yaml`

- [ ] **Step 1: Add React Query Devtools and Supabase CLI as dev deps**

From `client/`:
```bash
pnpm add -D @tanstack/react-query-devtools supabase
```
Expected: both packages appear under `devDependencies`.

- [ ] **Step 2: Commit**

```bash
cd ..
git add client/package.json client/pnpm-lock.yaml
git commit -m "chore: add react-query-devtools and supabase CLI as dev deps"
```

---

## Task 6: Create the Bulletproof React folder skeleton

**Files:**
- Create: `client/src/assets/.gitkeep`
- Create: `client/src/config/.gitkeep`
- Create: `client/src/features/.gitkeep`
- Create: `client/src/hooks/.gitkeep`
- Create: `client/src/stores/.gitkeep`
- Create: `client/src/testing/.gitkeep`
- Create: `client/src/types/.gitkeep`
- Create: `client/src/utils/.gitkeep`

(Folders `app/`, `components/`, and `lib/` already exist from create-next-app and shadcn init.)

- [ ] **Step 1: Make the eight empty folders with .gitkeep**

From `client/`:
```bash
for d in assets config features hooks stores testing types utils; do
  mkdir -p "src/$d" && touch "src/$d/.gitkeep"
done
```

- [ ] **Step 2: Verify the full src layout matches the spec**

Run (from `client/`):
```bash
ls src/
```
Expected output (order may vary): `app  assets  components  config  features  hooks  lib  stores  testing  types  utils`.

Every folder named in the spec §3 should be present. If any are missing, create them.

- [ ] **Step 3: Commit**

```bash
cd ..
git add client/src/
git commit -m "chore: add Bulletproof React folder skeleton under client/src"
```

---

## Task 7: Add `.env.local.example`

**Files:**
- Create: `client/.env.local.example`

- [ ] **Step 1: Write the env template**

Create `client/.env.local.example` with the following exact contents:

```env
# Supabase project credentials.
# Get these from https://app.supabase.com → Project Settings → API,
# or from `supabase status` when running the local stack.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 2: Verify .env.local is gitignored**

Run (from `client/`):
```bash
grep -E '\.env' .gitignore
```
Expected: `.env*` (or similar) — create-next-app's default `.gitignore` already excludes `.env*` files. If it doesn't, append `.env.local` to `client/.gitignore`.

- [ ] **Step 3: Commit**

```bash
cd ..
git add client/.env.local.example
git commit -m "chore: add Supabase env var template"
```

---

## Task 8: Add the Supabase browser client

**Files:**
- Create: `client/src/lib/supabase/client.ts`

**Source:** <https://supabase.com/docs/guides/auth/server-side/nextjs> — "Set up Supabase client". Before pasting, open the URL and confirm the snippet matches; if it has drifted, use what the docs show today.

- [ ] **Step 1: Create the file**

Create `client/src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run (from `client/`):
```bash
pnpm tsc --noEmit
```
Expected: exits 0 with no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add client/src/lib/supabase/client.ts
git commit -m "chore: add Supabase browser client (official @supabase/ssr boilerplate)"
```

---

## Task 9: Add the Supabase server client

**Files:**
- Create: `client/src/lib/supabase/server.ts`

**Source:** same Supabase Next.js SSR guide. Re-verify the snippet before pasting.

- [ ] **Step 1: Create the file**

Create `client/src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

From `client/`:
```bash
pnpm tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd ..
git add client/src/lib/supabase/server.ts
git commit -m "chore: add Supabase server client (official @supabase/ssr boilerplate)"
```

---

## Task 10: Add the Supabase middleware helper and Next.js middleware entry

**Files:**
- Create: `client/src/lib/supabase/middleware.ts`
- Create: `client/src/middleware.ts`

**Source:** same Supabase Next.js SSR guide, "Middleware" section.

- [ ] **Step 1: Create the updateSession helper**

Create `client/src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to
  // debug issues with users being randomly logged out.
  await supabase.auth.getUser()

  return supabaseResponse
}
```

- [ ] **Step 2: Create the Next.js middleware entry**

With the `src/` directory convention, the middleware lives at `client/src/middleware.ts`. Create that file:

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 3: Verify TypeScript compiles**

From `client/`:
```bash
pnpm tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
cd ..
git add client/src/lib/supabase/middleware.ts client/src/middleware.ts
git commit -m "chore: add Supabase SSR middleware for session refresh"
```

---

## Task 11: Add the TanStack Query client factory

**Files:**
- Create: `client/src/lib/react-query/get-query-client.ts`

**Source:** <https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr> — "Initial setup".

- [ ] **Step 1: Create the file**

Create `client/src/lib/react-query/get-query-client.ts`:

```ts
import {
  isServer,
  QueryClient,
  defaultShouldDehydrateQuery,
} from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
        shouldRedactErrors: () => false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
```

- [ ] **Step 2: Verify TypeScript compiles**

From `client/`:
```bash
pnpm tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd ..
git add client/src/lib/react-query/get-query-client.ts
git commit -m "chore: add TanStack Query client factory (official SSR boilerplate)"
```

---

## Task 12: Add the TanStack Query provider component

**Files:**
- Create: `client/src/lib/react-query/providers.tsx`

- [ ] **Step 1: Create the provider**

Create `client/src/lib/react-query/providers.tsx`:

```tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from './get-query-client'

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

From `client/`:
```bash
pnpm tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd ..
git add client/src/lib/react-query/providers.tsx
git commit -m "chore: add TanStack Query provider with devtools"
```

---

## Task 13: Wire the provider into the root layout

**Files:**
- Modify: `client/src/app/layout.tsx`

- [ ] **Step 1: Read the current layout**

Run (from `client/`):
```bash
cat src/app/layout.tsx
```
Note the current `RootLayout` body — we will wrap `{children}` with `<ReactQueryProvider>`.

- [ ] **Step 2: Make two surgical edits to the layout**

Do NOT replace the whole file. Make exactly two changes to `client/src/app/layout.tsx`:

**Edit A — add the import.** Below the existing imports at the top of the file (which include `Geist`/`Geist_Mono` from `next/font/google`, `Metadata` from `next`, and `./globals.css`), add:

```tsx
import { ReactQueryProvider } from '@/lib/react-query/providers'
```

**Edit B — wrap `{children}` inside `<body>`.** Find the `<body className={...}>{children}</body>` line and wrap `{children}` with `<ReactQueryProvider>`. Before:

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
  {children}
</body>
```

After:

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
  <ReactQueryProvider>{children}</ReactQueryProvider>
</body>
```

Leave every other line (fonts, `metadata` export, `<html>` tag, className expression) untouched.

- [ ] **Step 3: Verify TypeScript and lint**

From `client/`:
```bash
pnpm tsc --noEmit && pnpm lint
```
Expected: both exit 0.

- [ ] **Step 4: Boot the dev server and verify the devtools mount**

```bash
pnpm dev
```
Open `http://localhost:3000`. The default Next.js page should still render. A small TanStack Query Devtools logo should appear in the bottom-right corner (clickable to open the panel). Stop the server (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
cd ..
git add client/src/app/layout.tsx
git commit -m "chore: wrap root layout with TanStack Query provider"
```

---

## Task 14: Final verification against spec §8

This task runs the spec's definition-of-done checks. No code changes.

- [ ] **Step 1: Fresh install verification**

From `client/`:
```bash
rm -rf node_modules && pnpm install
```
Expected: clean install, no errors.

- [ ] **Step 2: Build verification**

From `client/`:
```bash
pnpm build
```
Expected: successful production build (warnings about missing env vars at runtime are acceptable since `.env.local` doesn't exist yet; type errors are not).

- [ ] **Step 3: Folder structure check**

From repo root:
```bash
ls client/src/
```
Expected output contains exactly: `app`, `assets`, `components`, `config`, `features`, `hooks`, `lib`, `stores`, `testing`, `types`, `utils` (all 11 Bulletproof React folders).

- [ ] **Step 4: Mandatory files exist**

From repo root:
```bash
ls client/components.json \
   client/src/middleware.ts \
   client/.env.local.example \
   client/src/lib/supabase/client.ts \
   client/src/lib/supabase/server.ts \
   client/src/lib/supabase/middleware.ts \
   client/src/lib/react-query/get-query-client.ts \
   client/src/lib/react-query/providers.tsx \
   supabase/config.toml
```
Expected: all files listed, no "No such file" errors.

- [ ] **Step 5: Dev server smoke test with devtools**

From `client/`:
```bash
pnpm dev
```
Open `http://localhost:3000`. Verify:
- Default Next.js landing page renders.
- React Query Devtools logo visible in the corner.
- No console errors related to Supabase (env vars missing is fine for now).

Stop the server.

- [ ] **Step 6: No untracked changes**

From repo root:
```bash
git status
```
Expected: working tree clean.

- [ ] **Step 7: No commit needed — verification only**

If all checks pass, the initialization is complete. Report success to the user. If any check fails, fix the underlying task and re-run the relevant verification step.
