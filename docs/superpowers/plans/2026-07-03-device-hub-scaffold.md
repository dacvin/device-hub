# device-hub Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a running, correctly-wired Next.js App Router frontend in `client/` plus Supabase CLI config in `supabase/`, with the agreed stack integrated — no product features.

**Architecture:** Plain two-folder layout (`client/` = self-contained Next app, `supabase/` = CLI config), no monorepo tooling. The FE follows the Bulletproof React feature-based structure adapted for App Router (`src/app/` is the routing layer; other layers sit alongside under `src/`). All setup uses official commands/config pulled from official docs — nothing hand-authored.

**Tech Stack:** Next.js 16 (App Router, TypeScript, Turbopack) · Tailwind CSS · shadcn/ui · TanStack Query (server state) · TanStack Form + Zod (forms/validation) · next-intl (i18n, no URL locale, cookie-persisted) · Zustand (client/UI state) · Supabase (`@supabase/ssr` + `supabase-js`) · pnpm.

## Global Constraints

- Package manager: **pnpm** — every install uses pnpm.
- The Next app lives entirely under `client/`; the repo root already is a git repo — do NOT create a nested git repo inside `client/`.
- **Official sources only.** Each task cites the official doc URL for its commands/code. Copy code from those URLs; do not invent variants. If a fetched snippet conflicts with the current doc at implementation time, the live official doc wins.
- Supabase scope: init + SSR client factories + session-refresh middleware. **No login/signup UI, no DB schema, no migrations, no edge functions.**
- No ESLint/Prettier config changes beyond what `create-next-app` scaffolds (user will supply configs later).
- next-intl: **no URL locale segments**; locale persisted in a cookie named `locale`.
- Locales for this scaffold: `en` (default) and `vi`.
- Env var names (official `@supabase/ssr`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- YAGNI: no speculative abstractions. The single `/demo` page exists only to verify wiring and is explicitly safe to delete.

## Verification approach

This is scaffolding, not business logic, so there is no unit-test framework in scope (adding one would violate YAGNI). Each task's "test" is a concrete verification gate:
- `pnpm build` (from `client/`) — must succeed with no type/compile errors.
- Dev-server render checks — start `pnpm dev`, load a URL, confirm expected content.
Run all `pnpm`/`npx`/`pnpm dlx` commands **from inside `client/`** unless a step says otherwise. `supabase` commands run from the **repo root**.

## File / responsibility map

```
device-hub/
  supabase/                     # Task 7 — supabase init output (config.toml, .gitignore)
  client/                       # Task 1 — create-next-app output
    next.config.ts              # Task 5 — wrapped with next-intl plugin
    middleware.ts               # Task 8 — calls supabase updateSession
    messages/
      en.json                   # Task 5
      vi.json                   # Task 5
    src/
      app/
        layout.tsx              # Tasks 4,5 — mounts NextIntlClientProvider + AppProvider
        page.tsx                # Task 1 (scaffold), left as home
        provider.tsx            # Task 4 — 'use client' AppProvider (ErrorBoundary+Query+Devtools+Notifications)
        demo/page.tsx          # Tasks 4,5,6 — wiring smoke page (safe to delete)
        actions/set-locale.ts   # Task 5 — 'use server' locale cookie setter
      i18n/
        request.ts              # Task 5 — getRequestConfig reads locale cookie
      components/
        ui/                     # Task 3 — shadcn components (button)
        ui/notifications/       # Task 4 — Bulletproof Notifications (store + components + index)
        errors/main.tsx         # Task 4 — MainErrorFallback (ErrorBoundary fallback)
        locale-switcher.tsx     # Task 5 — client component, calls setLocale
      config/                   # Task 2 — (structure)
      features/                 # Task 2 — (structure)
      hooks/                    # Task 2 — (structure)
      lib/
        react-query.ts          # Task 4 — queryConfig + getQueryClient() + helper types
        supabase/
          client.ts             # Task 8 — createBrowserClient factory
          server.ts             # Task 8 — createServerClient factory (async)
          middleware.ts         # Task 8 — updateSession
      stores/                   # Task 2 — (structure); Task 6 adds ui-store.ts
      types/                    # Task 2 — (structure)
      utils/                    # Task 2 — (structure)
      testing/                  # Task 2 — (structure)
      assets/                   # Task 2 — (structure)
```

---

### Task 1: Scaffold the Next.js app in `client/`

**Files:**
- Create: `client/` (entire create-next-app output)

**Official source:** https://nextjs.org/docs/app/api-reference/cli/create-next-app

- [ ] **Step 1: Run create-next-app**

From the repo root (`/Users/sioux/Developer/device-hub`):

```bash
pnpm create next-app@latest client --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --disable-git --no-agents-md
```

Notes:
- `--src-dir` gives the `src/` layout Bulletproof React expects.
- `--disable-git` prevents a nested git repo (root already is one).
- `--no-agents-md` skips the generated `AGENTS.md`/`CLAUDE.md` so it doesn't shadow the root `CLAUDE.md`. If this flag errors on the installed CLI version, drop it, then delete `client/AGENTS.md` and `client/CLAUDE.md` manually.

- [ ] **Step 2: Verify the build**

```bash
cd client && pnpm build
```
Expected: build completes, "Compiled successfully" (no errors).

- [ ] **Step 3: Verify the dev server renders**

```bash
pnpm dev
```
Open `http://localhost:3000` → the default Next.js starter page renders. Stop the server (Ctrl-C).

- [ ] **Step 4: Commit**

```bash
cd /Users/sioux/Developer/device-hub
git add client
git commit -m "chore: scaffold Next.js app in client/ via create-next-app"
```

---

### Task 2: Apply the Bulletproof React folder structure

**Files:**
- Create: `client/src/{config,features,hooks,lib,stores,types,utils,testing,assets}/` (with `.gitkeep` each)

**Official source (reference):** https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md

**Interfaces:**
- Produces: the shared layer directories that later tasks populate (`lib/supabase/`, `stores/`, etc.).

- [ ] **Step 1: Create the layer directories**

From `client/`:

```bash
mkdir -p src/config src/features src/hooks src/lib src/stores src/types src/utils src/testing src/assets
for d in config features hooks lib stores types utils testing assets; do touch "src/$d/.gitkeep"; done
```

Rationale: `src/app/` (already created by Task 1) is the application/routing layer; `src/components/` already exists from the scaffold. These are the remaining Bulletproof React layers. Feature modules under `src/features/<name>/` will use `api/ components/ hooks/ stores/ types/ utils/` as needed — created per-feature later, not now (YAGNI).

- [ ] **Step 2: Verify nothing broke**

```bash
pnpm build
```
Expected: build still succeeds (empty dirs don't affect it; confirms no accidental damage).

- [ ] **Step 3: Commit**

```bash
git add src
git commit -m "chore: add Bulletproof React layer directories under src/"
```

---

### Task 3: Initialize shadcn/ui and add a Button

**Files:**
- Create: `client/components.json`, `client/src/components/ui/button.tsx` (+ shadcn edits to `globals.css`, `lib/utils.ts`)
- Modify: `client/src/app/page.tsx`

**Official source:** https://ui.shadcn.com/docs/installation/next

- [ ] **Step 1: Init shadcn**

From `client/`:

```bash
pnpm dlx shadcn@latest init
```
Accept the defaults when prompted (it detects Next.js + Tailwind + the `@/*` alias). This creates `components.json` and `src/lib/utils.ts` (the `cn` helper).

- [ ] **Step 2: Add the button component**

```bash
pnpm dlx shadcn@latest add button
```
Creates `src/components/ui/button.tsx`, importable from `@/components/ui/button`.

- [ ] **Step 3: Render the button on the home page**

Replace `client/src/app/page.tsx` with:

```tsx
import { Button } from '@/components/ui/button'

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Button>device-hub</Button>
    </main>
  )
}
```

- [ ] **Step 4: Verify the styled button renders**

```bash
pnpm build && pnpm dev
```
Open `http://localhost:3000` → a styled shadcn Button reading "device-hub" is centered on the page. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add components.json src package.json pnpm-lock.yaml
git commit -m "feat: init shadcn/ui and render Button on home page"
```

---

### Task 4: Wire the Bulletproof AppProvider (TanStack Query + ErrorBoundary + Notifications + Devtools)

**Files:**
- Create: `client/src/lib/react-query.ts`, `client/src/app/provider.tsx`, `client/src/components/errors/main.tsx`, `client/src/components/ui/notifications/notifications-store.ts`, `client/src/components/ui/notifications/notification.tsx`, `client/src/components/ui/notifications/notifications.tsx`, `client/src/components/ui/notifications/index.ts`, `client/src/app/demo/page.tsx`
- Modify: `client/src/app/layout.tsx`

**Official sources:**
- TanStack Query SSR (`getQueryClient` pattern): https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
- Bulletproof React reference files (`lib/react-query.ts`, `app/provider.tsx`, `components/errors/main.tsx`, `components/ui/notifications/*`): https://github.com/alan2207/bulletproof-react/tree/master/apps/nextjs-app/src

**Interfaces:**
- Produces: `queryConfig`, `getQueryClient()`, and helper types `ApiFnReturnType`/`QueryConfig`/`MutationConfig` from `@/lib/react-query`; `AppProvider` (named export) from `@/app/provider`; `useNotifications` store + `Notifications` component from `@/components/ui/notifications`.

**Deviations from Bulletproof (intentional):** Bulletproof's `AppProvider` instantiates the client with `useState(() => new QueryClient(...))`; we call `getQueryClient()` instead so Server Components can prefetch + hydrate against Supabase SSR (agreed). And Bulletproof gates Devtools on `process.env.DEV` (a Vite-ism, undefined in Next); we use `process.env.NODE_ENV === 'development'`, which is correct in Next. Everything else is copied verbatim.

- [ ] **Step 1: Install the dependencies**

From `client/`:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools react-error-boundary nanoid zustand
```
(`lucide-react` — used by the Notification icons — was already installed by shadcn in Task 3.)

- [ ] **Step 2: Create the TanStack Query config + SSR-aware client (`lib/react-query.ts`)**

`client/src/lib/react-query.ts`:

```ts
import {
  DefaultOptions,
  QueryClient,
  UseMutationOptions,
  isServer,
} from '@tanstack/react-query'

export const queryConfig = {
  queries: {
    // throwOnError: true,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60,
  },
} satisfies DefaultOptions

function makeQueryClient() {
  return new QueryClient({ defaultOptions: queryConfig })
}

let browserQueryClient: QueryClient | undefined = undefined

// Server/browser-aware client so Server Components can prefetch + hydrate
// (TanStack "Advanced SSR"). Browser reuses a singleton across renders.
export function getQueryClient() {
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export type ApiFnReturnType<FnType extends (...args: any) => Promise<any>> =
  Awaited<ReturnType<FnType>>

export type QueryConfig<T extends (...args: any[]) => any> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>

export type MutationConfig<
  MutationFnType extends (...args: any) => Promise<any>,
> = UseMutationOptions<
  ApiFnReturnType<MutationFnType>,
  Error,
  Parameters<MutationFnType>[0]
>
```

- [ ] **Step 3: Create the error fallback (`components/errors/main.tsx`)**

`client/src/components/errors/main.tsx` (Bulletproof verbatim; import path adjusted to our `@/` alias):

```tsx
import { Button } from '@/components/ui/button'

export const MainErrorFallback = () => {
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center text-red-500"
      role="alert"
    >
      <h2 className="text-lg font-semibold">Ooops, something went wrong :( </h2>
      <Button
        className="mt-4"
        onClick={() => window.location.assign(window.location.origin)}
      >
        Refresh
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Create the Notifications store (`components/ui/notifications/notifications-store.ts`)**

Bulletproof verbatim:

```ts
import { nanoid } from 'nanoid'
import { create } from 'zustand'

export type Notification = {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message?: string
}

type NotificationsStore = {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  dismissNotification: (id: string) => void
}

export const useNotifications = create<NotificationsStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { id: nanoid(), ...notification }],
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id,
      ),
    })),
}))
```

- [ ] **Step 5: Create the Notification item (`components/ui/notifications/notification.tsx`)**

Bulletproof verbatim:

```tsx
'use client'

import { Info, CircleAlert, CircleX, CircleCheck } from 'lucide-react'

const icons = {
  info: <Info className="size-6 text-blue-500" aria-hidden="true" />,
  success: <CircleCheck className="size-6 text-green-500" aria-hidden="true" />,
  warning: <CircleAlert className="size-6 text-yellow-500" aria-hidden="true" />,
  error: <CircleX className="size-6 text-red-500" aria-hidden="true" />,
}

export type NotificationProps = {
  notification: {
    id: string
    type: keyof typeof icons
    title: string
    message?: string
  }
  onDismiss: (id: string) => void
}

export const Notification = ({
  notification: { id, type, title, message },
  onDismiss,
}: NotificationProps) => {
  return (
    <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5">
        <div className="p-4" role="alert" aria-label={title}>
          <div className="flex items-start">
            <div className="shrink-0">{icons[type]}</div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">{title}</p>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
            <div className="ml-4 flex shrink-0">
              <button
                className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                onClick={() => {
                  onDismiss(id)
                }}
              >
                <span className="sr-only">Close</span>
                <CircleX className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create the Notifications container + barrel**

`client/src/components/ui/notifications/notifications.tsx` (Bulletproof verbatim):

```tsx
'use client'

import { Notification } from './notification'
import { useNotifications } from './notifications-store'

export const Notifications = () => {
  const { notifications, dismissNotification } = useNotifications()

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end space-y-4 px-4 py-6 sm:items-start sm:p-6"
    >
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  )
}
```

`client/src/components/ui/notifications/index.ts`:

```ts
export * from './notifications'
export * from './notifications-store'
```

- [ ] **Step 7: Create the AppProvider (`app/provider.tsx`)**

`client/src/app/provider.tsx` (Bulletproof structure; `getQueryClient()` + Next dev check per the deviations note above):

```tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { MainErrorFallback } from '@/components/errors/main'
import { Notifications } from '@/components/ui/notifications'
import { getQueryClient } from '@/lib/react-query'

type AppProviderProps = {
  children: React.ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const queryClient = getQueryClient()

  return (
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <QueryClientProvider client={queryClient}>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        <Notifications />
        {children}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
```

- [ ] **Step 8: Mount AppProvider in the root layout**

Modify `client/src/app/layout.tsx` — wrap `{children}` with `<AppProvider>`:

```tsx
import { AppProvider } from './provider'
// ...existing imports/metadata/font code left unchanged...

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body /* keep the scaffold's existing className */>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
```
(Preserve the font variables/className `create-next-app` put on `<body>`; only add the `<AppProvider>` wrapper. Task 5 will wrap `<AppProvider>` inside `<NextIntlClientProvider>`.)

- [ ] **Step 9: Add a smoke query + notification trigger on the demo page**

`client/src/app/demo/page.tsx`:

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useNotifications } from '@/components/ui/notifications'

export default function DemoPage() {
  // Wiring smoke test — safe to delete this whole /demo route.
  const { data } = useQuery({
    queryKey: ['smoke'],
    queryFn: async () => 'tanstack-query-ok',
  })
  const { addNotification } = useNotifications()

  return (
    <main className="flex flex-col gap-4 p-8">
      <h1 className="text-xl font-bold">Wiring smoke test</h1>
      <p data-testid="query-result">Query: {data ?? 'loading…'}</p>
      <button
        className="w-fit border p-2"
        onClick={() =>
          addNotification({
            type: 'success',
            title: 'It works',
            message: 'Notifications are wired',
          })
        }
      >
        Notify
      </button>
    </main>
  )
}
```

- [ ] **Step 10: Verify**

```bash
pnpm build && pnpm dev
```
Open `http://localhost:3000/demo`:
- Shows "Query: tanstack-query-ok" (TanStack Query works).
- The React Query **Devtools** toggle appears (dev only).
- Click **Notify** → a success toast appears (Notifications store + component work).
- `pnpm build` succeeding confirms the `ErrorBoundary`/`AppProvider` tree type-checks.
Stop the server.

- [ ] **Step 11: Commit**

```bash
git add src package.json pnpm-lock.yaml
git commit -m "feat: add Bulletproof AppProvider (Query + ErrorBoundary + Notifications + Devtools)"
```

---

### Task 5: Wire next-intl (without i18n routing, cookie-persisted)

**Files:**
- Create: `client/src/i18n/request.ts`, `client/messages/en.json`, `client/messages/vi.json`, `client/src/app/actions/set-locale.ts`, `client/src/components/locale-switcher.tsx`
- Modify: `client/next.config.ts`, `client/src/app/layout.tsx`, `client/src/app/demo/page.tsx`

**Official source:** https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing

**Interfaces:**
- Produces: server action `setLocale(locale: string): Promise<void>` from `@/app/actions/set-locale`; `LocaleSwitcher` (default export) client component.

- [ ] **Step 1: Install next-intl**

From `client/`:

```bash
pnpm add next-intl
```

- [ ] **Step 2: Create message catalogs**

`client/messages/en.json`:

```json
{
  "Demo": {
    "greeting": "Hello from device-hub"
  }
}
```

`client/messages/vi.json`:

```json
{
  "Demo": {
    "greeting": "Xin chào từ device-hub"
  }
}
```

- [ ] **Step 3: Create the request config (reads the `locale` cookie)**

`client/src/i18n/request.ts`:

```ts
import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  const store = await cookies()
  const locale = store.get('locale')?.value || 'en'

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 4: Wrap next.config with the next-intl plugin**

Modify `client/next.config.ts`:

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  /* keep any options create-next-app added here */
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
export default withNextIntl(nextConfig)
```
(Pass the explicit `./src/i18n/request.ts` path since we use a `src/` directory.)

- [ ] **Step 5: Add the NextIntlClientProvider to the layout**

Modify `client/src/app/layout.tsx` — make the component `async`, read locale/messages, and wrap so next-intl is outermost and `AppProvider` (from Task 4) is inside:

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { AppProvider } from './provider'
// ...existing imports/metadata/font code unchanged...

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body /* keep the scaffold's existing className */>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProvider>{children}</AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Create the set-locale server action**

`client/src/app/actions/set-locale.ts`:

```ts
'use server'

import { cookies } from 'next/headers'

export async function setLocale(locale: string) {
  const store = await cookies()
  store.set('locale', locale)
}
```

- [ ] **Step 7: Create the LocaleSwitcher client component**

`client/src/components/locale-switcher.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { setLocale } from '@/app/actions/set-locale'
import { Button } from '@/components/ui/button'

export default function LocaleSwitcher() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchTo(locale: string) {
    startTransition(async () => {
      await setLocale(locale)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-2">
      <Button disabled={isPending} onClick={() => switchTo('en')}>
        EN
      </Button>
      <Button disabled={isPending} onClick={() => switchTo('vi')}>
        VI
      </Button>
    </div>
  )
}
```

- [ ] **Step 8: Use translations on the demo page**

Modify `client/src/app/demo/page.tsx` — add a translated greeting and the switcher. Since the page reads `useTranslations` (a client hook is fine here as it's already `'use client'`):

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import LocaleSwitcher from '@/components/locale-switcher'
import { useNotifications } from '@/components/ui/notifications'

export default function DemoPage() {
  // Wiring smoke test — safe to delete this whole /demo route.
  const t = useTranslations('Demo')
  const { data } = useQuery({
    queryKey: ['smoke'],
    queryFn: async () => 'tanstack-query-ok',
  })
  const { addNotification } = useNotifications()

  return (
    <main className="flex flex-col gap-4 p-8">
      <h1 className="text-xl font-bold">{t('greeting')}</h1>
      <p data-testid="query-result">Query: {data ?? 'loading…'}</p>
      <LocaleSwitcher />
      <button
        className="w-fit border p-2"
        onClick={() =>
          addNotification({
            type: 'success',
            title: 'It works',
            message: 'Notifications are wired',
          })
        }
      >
        Notify
      </button>
    </main>
  )
}
```

- [ ] **Step 9: Verify locale switching**

```bash
pnpm build && pnpm dev
```
Open `http://localhost:3000/demo` → greeting shows "Hello from device-hub". Click **VI** → greeting flips to "Xin chào từ device-hub", the URL stays `/demo` (no locale segment), and a `locale=vi` cookie is set (check DevTools → Application → Cookies). Click **EN** → flips back. Stop the server.

- [ ] **Step 10: Commit**

```bash
git add src messages next.config.ts package.json pnpm-lock.yaml
git commit -m "feat: wire next-intl without i18n routing (cookie-persisted locale)"
```

---

### Task 6: Wire TanStack Form + Zod + Zustand (validated demo form with UI store)

**Files:**
- Create: `client/src/stores/ui-store.ts`
- Modify: `client/src/app/demo/page.tsx`

**Official sources:**
- TanStack Form quick start: https://tanstack.com/form/latest/docs/framework/react/quick-start
- Zustand: https://github.com/pmndrs/zustand (install + `create`)

**Interfaces:**
- Produces: `useUiStore` hook exposing `{ debugOpen: boolean; toggleDebug: () => void }`.

- [ ] **Step 1: Install the libraries**

From `client/` (`zustand` was already installed in Task 4 for Notifications):

```bash
pnpm add @tanstack/react-form zod
```

- [ ] **Step 2: Create a minimal Zustand UI store**

`client/src/stores/ui-store.ts`:

```ts
import { create } from 'zustand'

type UiState = {
  debugOpen: boolean
  toggleDebug: () => void
}

export const useUiStore = create<UiState>((set) => ({
  debugOpen: false,
  toggleDebug: () => set((s) => ({ debugOpen: !s.debugOpen })),
}))
```

- [ ] **Step 3: Add a Zod-validated form + store toggle to the demo page**

Modify `client/src/app/demo/page.tsx` to add a TanStack Form validated by a Zod schema, plus a button reading the Zustand store. Full file:

```tsx
'use client'

import { useForm } from '@tanstack/react-form'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import LocaleSwitcher from '@/components/locale-switcher'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/components/ui/notifications'
import { useUiStore } from '@/stores/ui-store'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

export default function DemoPage() {
  // Wiring smoke test — safe to delete this whole /demo route.
  const t = useTranslations('Demo')
  const { data } = useQuery({
    queryKey: ['smoke'],
    queryFn: async () => 'tanstack-query-ok',
  })
  const { addNotification } = useNotifications()
  const { debugOpen, toggleDebug } = useUiStore()

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onChange: schema },
    onSubmit: ({ value }) => {
      alert(`submitted: ${value.email}`)
    },
  })

  return (
    <main className="flex flex-col gap-4 p-8">
      <h1 className="text-xl font-bold">{t('greeting')}</h1>
      <p data-testid="query-result">Query: {data ?? 'loading…'}</p>
      <LocaleSwitcher />

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <form.Field
          name="email"
          children={(field) => (
            <>
              <input
                className="border p-2"
                placeholder="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.length > 0 && (
                <span data-testid="email-error" className="text-red-600">
                  {String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}
                </span>
              )}
            </>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>

      <Button variant="outline" onClick={toggleDebug}>
        Debug panel: {debugOpen ? 'open' : 'closed'}
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          addNotification({
            type: 'success',
            title: 'It works',
            message: 'Notifications are wired',
          })
        }
      >
        Notify
      </Button>
    </main>
  )
}
```

- [ ] **Step 4: Verify form validation, submit, and store toggle**

```bash
pnpm build && pnpm dev
```
Open `http://localhost:3000/demo`:
- Type an invalid email (e.g. `foo`) → an error message appears (Zod validation via TanStack Form).
- Type a valid email and Submit → alert shows `submitted: <email>`.
- Click "Debug panel" → label toggles between "closed" and "open" (Zustand store works).
Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src package.json pnpm-lock.yaml
git commit -m "feat: wire TanStack Form + Zod validation and Zustand UI store"
```

---

### Task 7: Initialize Supabase CLI config

**Files:**
- Create: `supabase/` (config.toml, .gitignore), `client/.env.local`, `client/.env.example`

**Official sources:**
- Local dev / CLI: https://supabase.com/docs/guides/local-development/cli/getting-started
- Env vars: https://supabase.com/docs/guides/auth/server-side/nextjs

- [ ] **Step 1: Ensure the Supabase CLI is available**

If `supabase --version` fails, install it (macOS):

```bash
brew install supabase/tap/supabase
```

- [ ] **Step 2: Initialize Supabase at the repo root**

From `/Users/sioux/Developer/device-hub`:

```bash
supabase init
```
Creates the `supabase/` folder (`config.toml` + `.gitignore`). Safe to commit.

- [ ] **Step 3: Start the local stack and capture credentials**

```bash
supabase start
```
(First run downloads Docker images; requires Docker running.) When it finishes it prints an `API URL` (e.g. `http://127.0.0.1:54321`) and keys. Note the API URL and the publishable/anon key.

- [ ] **Step 4: Create env files for the client**

`client/.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`client/.env.local` (fill with values from Step 3 — this file is git-ignored by the scaffold's `.gitignore`):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key from `supabase start`>
```

- [ ] **Step 5: Verify**

```bash
supabase status
```
Expected: services listed as running with the same API URL. Confirm `supabase/config.toml` exists.

- [ ] **Step 6: Commit** (config + example only; never the real `.env.local`)

```bash
git add supabase client/.env.example
git commit -m "chore: init Supabase CLI config and client env example"
```

---

### Task 8: Add the official Supabase SSR integration (clients + middleware)

**Files:**
- Create: `client/src/lib/supabase/client.ts`, `client/src/lib/supabase/server.ts`, `client/src/lib/supabase/middleware.ts`, `client/middleware.ts`
- Modify: `client/src/app/demo/page.tsx` reference not needed; add a server check via a route (below)

**Official source:** https://supabase.com/docs/guides/auth/server-side/nextjs

**Interfaces:**
- Produces: browser `createClient()` from `@/lib/supabase/client`; async server `createClient()` from `@/lib/supabase/server`; `updateSession(request)` from `@/lib/supabase/middleware`.

- [ ] **Step 1: Install the Supabase libraries**

From `client/`:

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Browser client**

`client/src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
```

- [ ] **Step 3: Server client (async — Next 16 `cookies()` is async)**

`client/src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
            // Called from a Server Component — safe to ignore when middleware refreshes sessions.
          }
        },
      },
    },
  )
}
```

- [ ] **Step 4: Middleware session refresher**

`client/src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: do not run code between createServerClient and getUser().
  await supabase.auth.getUser()

  return supabaseResponse
}
```

- [ ] **Step 5: Root middleware entry**

`client/middleware.ts`:

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 6: Add a server-side Supabase smoke route**

`client/src/app/demo/supabase/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function SupabaseSmoke() {
  // Wiring smoke test — proves the server client initializes and reaches local Supabase.
  const supabase = await createClient()
  const { error } = await supabase.auth.getUser()

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold">Supabase server client</h1>
      <p data-testid="supabase-status">
        {error ? `reachable (no session: ${error.message})` : 'reachable (session present)'}
      </p>
    </main>
  )
}
```
(With no logged-in user, `getUser()` returns an "Auth session missing" error — that's expected and still proves the client initialized and contacted Supabase without throwing.)

- [ ] **Step 7: Verify**

Ensure `supabase start` is running and `client/.env.local` is filled (Task 7).

```bash
pnpm build && pnpm dev
```
- Open `http://localhost:3000/demo/supabase` → shows "reachable (no session: …)" without a server error/500. This confirms the server client + env wiring work.
- The build compiling confirms `middleware.ts` and both client factories type-check.
Stop the server.

- [ ] **Step 8: Commit**

```bash
git add src middleware.ts package.json pnpm-lock.yaml
git commit -m "feat: add official Supabase SSR clients and session-refresh middleware"
```

---

## Self-Review

**Spec coverage** (against `docs/superpowers/specs/2026-07-03-device-hub-scaffold-design.md`):
- Repo layout `client/` + `supabase/`, no monorepo → Tasks 1, 7. ✓
- Stack: Next App Router/TS/Tailwind (1), shadcn (3), TanStack Query (4), next-intl cookie no-URL (5), TanStack Form + Zod + Zustand (6), Supabase SSR (7,8). ✓
- Bulletproof React structure (`lib/` = library config, `app/provider.tsx` = AppProvider) → Tasks 2, 4. ✓
- App-wide providers: Bulletproof `AppProvider` (ErrorBoundary + QueryClientProvider + Devtools + Notifications) wrapped inside `NextIntlClientProvider` in the layout → Tasks 4, 5. ✓
- next-intl "without routing", cookie `locale`, server action switch → Task 5. ✓
- Supabase browser/server factories + middleware, no login UI/schema → Task 8. ✓
- shadcn init + one component → Task 3. ✓
- Success criteria: `pnpm dev` boots (1), shadcn renders (3), locale switch via cookie no URL change (5), supabase clients import + middleware compiles (8), `supabase/` initialized + `supabase start` (7), commands traceable to official docs (URLs cited per task). ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; commands include expected output. ✓

**Type consistency:** `getQueryClient`/`queryConfig` defined in `@/lib/react-query` (Task 4), consumed by `AppProvider` (Task 4); `AppProvider` named export consumed by layout (Tasks 4, 5); `useNotifications` defined in Task 4, consumed by the demo page (Tasks 4, 5, 6); `createClient` names distinct by module (`@/lib/supabase/client` vs `@/lib/supabase/server`); `setLocale`/`useUiStore`/`LocaleSwitcher` signatures match between definition and use. New deps introduced in Task 4: `@tanstack/react-query`, `@tanstack/react-query-devtools`, `react-error-boundary`, `nanoid`, `zustand` (Task 6 then adds only `@tanstack/react-form`, `zod`). ✓

**Note / demo cleanup:** The `/demo` routes and `src/stores/ui-store.ts` are wiring smoke tests. They are safe to delete once real features begin; nothing else imports them.
