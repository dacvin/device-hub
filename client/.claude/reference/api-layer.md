# API Layer

The client data layer lives in per-feature `features/<feature>/api/` folders. This file **describes** the pattern — the code is the source of truth.

**Supabase speaks snake_case; the app speaks camelCase**, so transform at the DB boundary:

- **Read:** `camelcaseKeys` the data after reading from the DB.
- **Write:** `snakecaseKeys` before writing, then `camelcaseKeys` the returned data.

**Zod validates inputs** — mutation payloads and query params (pagination / filters / sort).

## Examples

- **Mutations** (insert, update) → [`api/mutations.md`](./api/mutations.md)
- **Queries** (get, list, paginated) → [`api/queries.md`](./api/queries.md)
- **Infinite** (keyset scroll) → [`api/infinite-query.md`](./api/infinite-query.md)

## Conventions

One request per file; no barrel/`index.ts` files. Types in `types/`, enum value arrays in `constants/`. Import boundaries enforced by eslint (`pnpm lint`).
