# Validation: Infrastructure + Zero/Database + Packages

## Confirmed Findings

### Infrastructure (SYNC items)

**S1. `package.json` — engines/upgradeSets/trustedDependencies**: CONFIRMED.
- Takeout still has `"npm": "10.8.3"` in engines (chat removed it).
- Takeout already has `upgradeSets` but is missing `"drizzle"` group (chat has `"drizzle": ["drizzle-orm", "drizzle-kit"]`).
- Takeout `trustedDependencies` is `["@rocicorp/zero-sqlite3"]`; chat adds `"oxc-parser"`.

**S2. `package.json` scripts**: CONFIRMED.
- `backend:clean` already matches chat's version in takeout.
- `check` already matches (`tko check --default-all`).
- `format` already exists as `oxfmt`.
- Missing from takeout: `dev:fresh` (chat has `bun backend:clean; bun dev --clean`).

**S3. Dockerfile multi-stage build**: CONFIRMED. Takeout is single-stage with `curl | bash` bun install. Chat uses proper multi-stage (`bun-base` -> `prod-deps` -> `runtime`) with `COPY --from=oven/bun:1.3.9`.

**S4. docker-compose.yml postgres tuning**: CONFIRMED. Takeout postgres command block is missing the 7 tuning flags that chat has: `log_error_verbosity=terse`, `log_min_messages=fatal`, `idle_in_transaction_session_timeout=300000`, `statement_timeout=60000`, `tcp_keepalives_idle=60`, `tcp_keepalives_interval=10`, `tcp_keepalives_count=3`.

**S5. docker-compose.yml zero service env scoping**: CONFIRMED. Takeout's zero service has `env_file: .env` which leaks the entire .env. Chat removed this and switched to explicit env var list with defaults.

**S6. tsconfig.json**: CONFIRMED. Takeout has `"exclude": ["./packages"]` and does not include `"./packages"` in `include`. Chat has `"./packages"` in include and explicit dist exclusions instead. Takeout still has `"noImplicitAny": false`, `"noUnusedLocals": false`, `"noUnusedParameters": false` explicitly set.

**S7. `.oxfmtrc.jsonc`**: CONFIRMED.
- Takeout uses `experimentalSortImports` (old API); chat uses `sortImports` (new API).
- Takeout uses `"side-effect"` group name; chat uses `"side_effect"`.
- Takeout has 6 type groups; chat collapsed to single `"type"`.
- Takeout has `trailingComma: "es5"`; chat has `"all"`.
- Takeout has `newlinesBetween: true`; chat has `false`.
- Takeout has `order: "asc"` and `ignoreCase: true`; chat removed both.
- Takeout has `"**/migrate-dist.js"` ignore; chat removed it (uses `"**/*.generated.**"` instead).

**S8. `.oxlintrc.json`**: CONFIRMED. Takeout is missing `"typescript"` plugin, all 14+ typescript rules, `react/jsx-no-constructed-context-values`, jsPlugins array, and additional ignore patterns (`src/database/migrations/**`, `**/.claude/**`).

**S9-S11. scripts/check/helpers/*.js**: CONFIRMED. These files exist in chat at the stated paths. `ssr-guards.js` is generic (not chat-specific). `script-imports.js` and `middleware-imports.js` are generic.

**S14-S15. scripts/migrate/**: CONFIRMED. Chat has `scripts/migrate/{add.ts, run.ts, generate.ts, sync-drizzle.ts}`. Takeout has `scripts/db/{add-migration.ts, migrate.ts}` but not the migrate category scripts.

**S17. scripts/ops/logs.ts**: Takeout has `scripts/uncloud/logs.ts`, not `scripts/ops/logs.ts`. NEEDS CHECKING.

**S21. playwright.config.ts**: CONFIRMED. Takeout's config at `src/test/playwright.config.ts` has static `timeout: 30 * 1000`, no CPU-based workers, `fullyParallel: false`, no CI-specific logic. Chat's config has CPU-based workers, CI-specific timeouts (60s CI, 20s local), `fullyParallel: true`.

### Infrastructure (ADAPT items)

**A2. docker-compose named volumes vs bind mounts**: CONFIRMED. Takeout uses named volumes (`pgdb_data:`, `zero_data:`, `minio_data:`). Chat uses bind mounts (`${DOCKER_DATA_DIR:-./.docker}/pgdb`). Phase 1 correctly says to keep named volumes in takeout.

**A3. docker-compose migrate service removal**: CONFIRMED. Takeout still has a `migrate` Docker service. Chat removed it; migrations run natively via `scripts/dev/migrate.ts`.

**A5. `.github/actions/install/action.yml`**: CONFIRMED.
- Takeout still has `bun-version-file: 'package.json'` (chat removed it).
- Takeout still has explicit `Postinstall` step (chat removed it because bun runs it automatically).
- Chat adds `libreadline-dev`, build cache for `packages/*/dist`, and `Generate Zero` step.
- Takeout has `Generate Environment` step that chat also has (via `bun tko run env-update`).

**A9. scripts/dev/migrate.ts**: CONFIRMED. Chat has this as a native migration runner with `waitForPostgres()`. Takeout does not have it. The default postgres port in chat is `5632` (takeout uses `5433`).

**A10. scripts/postinstall.ts**: CONFIRMED.
- Takeout calls `@take-out/scripts/build-initial` + `tko skills generate` + `env-update` + `one patch`.
- Chat does NOT call `build-initial`, instead calls `cd src/start && node build.mjs` + `env-update` + `one patch` + `tko skills generate` (only non-CI).
- The `build-initial` call is still needed in takeout until the `@take-out/scripts` package is verified to have removed it.

### Zero/Database

**CRITICAL BUG — ensureZeroPublication placement**: **ALREADY FIXED IN TAKEOUT.** Phase 1 claims takeout places `ensureZeroPublication()` after `migrate()`. This is WRONG. Reading `/Users/n8/takeout/src/database/migrate.ts` lines 50-58, `ensureZeroPublication()` is already correctly inside the `onMigrationComplete` callback. The bug described in Phase 1 does not exist in takeout's current code.

**Z-SYNC-1. init.sql — zero_cvr/zero_cdb databases**: CONFIRMED. Takeout's `init.sql` only has `CREATE EXTENSION IF NOT EXISTS pg_trgm`. Chat also adds `CREATE DATABASE zero_cvr; CREATE DATABASE zero_cdb;`.

**Z-SYNC-2. database/pool.ts**: CONFIRMED. Takeout uses `database.ts` with basic Pool and minimal error handler. Chat has `pool.ts` with hardened error handlers (per-client error handler, pg-protocol stream patch, keepAlive, max/timeout settings).

**Z-SYNC-3. database/helpers.ts import path**: CONFIRMED. Takeout imports from `'@take-out/postgres'` (root). Chat imports from `'@take-out/postgres/createServerHelpers'` (subpath). The postgres package exports `"./*"` pattern so both work, but subpath is more precise.

**Z-SYNC-4. database/.gitignore**: CONFIRMED. Takeout only has `migrate-dist.js`. Chat also has `dist/`.

**Z-SYNC-5. scripts/migrate/sync-drizzle.ts**: CONFIRMED exists in chat. Bridges drizzle v1 beta directory migrations to flat `.ts` wrappers. Generic, not chat-specific.

**Z-SYNC-7-8. zero/storage.ts + batchUpdates.ts**: CONFIRMED. Takeout has neither file. Chat has `storage.ts` (createKVStore with per-user idb), `storage.native.ts` (op-sqlite), `batchUpdates.ts` (react-dom export), `batchUpdates.native.ts`.

**Z-SYNC-9. zero/helpers/showClientDataError.ts**: CONFIRMED. Takeout does not have this file. Chat has it with deduplicating error display + Reload/Reset actions.

**Z-SYNC-10. zero/helpers/clearClientData.ts**: CONFIRMED. Takeout has this but calls `zero.close()` AFTER deleting IndexedDB. Chat calls `zero.close()` FIRST (before deleting), which is correct — close first to flush pending mutations.

**Z-SYNC-12. zero/mutate.ts**: CONFIRMED. Takeout does not have this file. Chat has typed proxy around `zero.mutate` with error handling and 90s timeout.

### Zero/Database (ADAPT items)

**Z-ADAPT-1. pg.server.ts**: CONFIRMED. Takeout does not have this file. Chat has it with drizzle instance, typed helpers (insertRow/updateRow/deleteRow), PgTimestampString epoch-ms patch, WithSQL type. Requires drizzle v1 beta + pool.ts.

**Z-ADAPT-2. migrate.ts rewrite**: PARTIALLY CONFIRMED. Chat's migrate.ts uses `readdirSync` for migration glob instead of `import.meta.glob`, derives PRIVATE_TABLES dynamically from schema-private via drizzle introspection (`PgTable` + `getTableName`), has incremental publication management (add/remove tables surgically vs drop/recreate), and stdio flush on exit. However, the "critical bug" claim about ensureZeroPublication is WRONG for takeout — it's already in the callback.

**Z-ADAPT-3. relations.ts — defineRelations API**: CONFIRMED. Takeout uses old-style `relations()` from `drizzle-orm/relations` in separate files (`relations-public.ts`, `relations-private.ts`). Chat uses new `defineRelations()` from `drizzle-orm` in a single `relations.ts`. Requires drizzle v1 beta.

**Z-ADAPT-4. zero/client.tsx**: CONFIRMED. Takeout's client is simpler — no stable auth ref, no session token auth, no error callbacks, no connection monitor, no `zeroDisabledByError` state. Chat's is significantly more robust.

**Z-ADAPT-5. zero/zeroServer.ts**: CONFIRMED. Takeout has `src/zero/server.ts`. Chat has `src/zero/zeroServer.ts` (renamed). Chat adds `defaultAllowAdminRole: 'all'`. Chat imports env from `~/constants/env-server` (takeout uses `~/server/env-server`). Chat does not use `assertString` wrapper.

**Z-ADAPT-6. Trigger infrastructure**: CONFIRMED. Chat has `src/database/triggers/ensureTriggers.ts` with a registry pattern + 10 trigger definitions. The registry/hook pattern is generic; the triggers themselves are chat-specific.

### Packages

**CONFIRMED**: No package structure changes needed. Chat consumes `@take-out/*` packages from npm at `0.2.10`. Takeout's `packages/` directory is the canonical source.

**server-only guard**: CONFIRMED. Takeout uses `process.env.VITE_ENVIRONMENT !== 'ssr'` in `packages/helpers/src/server-only.ts`. Chat's `packages/server-only/index.js` uses `typeof window !== 'undefined'`.

## Corrections

### Critical Bug Claim is WRONG for Current Takeout

Phase 1 states: "The takeout version places `ensureZeroPublication()` after `migrate()` which means it never runs on deploy."

**This is incorrect.** Takeout's `src/database/migrate.ts` (lines 50-58) already has:
```typescript
await migrate({
  ...
  onMigrationComplete: async () => {
    await ensureZeroPublication()
  },
})
```

The `ensureZeroPublication()` is correctly inside `onMigrationComplete`. The bug may have existed at the base commit but has been independently fixed.

### app.config.ts Plugin Path Change (S18)

Phase 1 says: `@take-out/takeout/withOpSqliteStatic` -> `@take-out/cli/withOpSqliteStatic`

**Takeout's app.config.ts does not reference `withOpSqliteStatic` at all.** It uses `expo-plugin-ios-static-libraries` plugin instead. This item is NOT APPLICABLE to takeout.

### scripts/db/psql.ts (S15)

Phase 1 says chat has `scripts/db/psql.ts`. Chat does have this file, but it requires `libreadline-dev` system dependency. However, takeout does not have a `psql.ts` script.

### scripts/web/build.ts (S16)

Phase 1 says this is "new". Takeout already has `scripts/web/build.ts`. Chat also has one. They likely differ — chat's has `--kind` flag with release/test/manual modes and writes a `startChatBuild.txt` marker. This should be ADAPT not SYNC.

### scripts/ops/logs.ts (S17)

Phase 1 says to update this. Takeout has `scripts/uncloud/logs.ts`, not `scripts/ops/logs.ts`. Path mismatch needs consideration.

### Drizzle Version — Phase 1 says `1.0.0-beta.9`

Chat actually has `"drizzle-orm": "1.0.0-beta.9-e89174b"` and `"drizzle-kit": "1.0.0-beta.9-e89174b"` (a specific git hash build, not the plain beta). Takeout has `"drizzle-orm": "^0.40.0"` and `"drizzle-kit": "^0.30.5"`.

### Zero Version

Chat has `"@rocicorp/zero": "0.26.1"`. Takeout has `"@rocicorp/zero": "0.25.12"`. Phase 1 is accurate here.

## Conflicts Found

### 1. docker-compose migrate service removal + native migration script

Takeout's `docker-compose.yml` has `migrate` service that `zero` depends on (`depends_on: migrate: condition: service_completed_successfully`). Removing the migrate service requires also updating zero's `depends_on` to only depend on `pgdb`. The native migration script (`scripts/dev/migrate.ts`) needs to be created first, and the `backend` script needs updating.

### 2. drizzle v1 beta upgrade — massive breaking change

This is the single highest-risk item. It changes:
- `relations()` API -> `defineRelations()` API (all relations files must be rewritten)
- Migration directory format changes (needs `sync-drizzle.ts`)
- `drizzle-kit` config may need updates
- `drizzle.config.ts` in takeout is version-compatible but migration output format changes

All relations files (`relations-public.ts`, `relations-private.ts`) must be merged into a single file using the new API.

### 3. Zero 0.26.x upgrade

Requires verifying `on-zero` workspace package compatibility. Takeout's `on-zero` is `workspace:*` so it depends on whatever is in `packages/`. The `defaultAllowAdminRole` parameter and `zeroServer.mutate` API changes need to be checked against the on-zero package version.

### 4. tsconfig.json — packages in include

Adding `"./packages"` to include and removing it from exclude will surface any type errors in packages that were previously hidden. The explicit `**/dist` exclusion is important to avoid checking built output.

### 5. oxfmt sortImports API rename

If takeout's `oxfmt` version is < the version that renamed `experimentalSortImports` to `sortImports`, updating the config will break. Need to verify oxfmt version supports the new API. Takeout has `"oxfmt": "^0.16.0"` — need to check if `sortImports` is supported in 0.16.0+.

### 6. .oxlintrc.json typescript plugin

Adding the `"typescript"` plugin enables type-aware linting. This will surface potentially MANY new lint errors across the codebase. This is a beneficial but disruptive change — should be done as a standalone step with a pass to fix violations.

## Already Applied

1. **`package.json` backend:clean** — Already uses `docker compose down --volumes --remove-orphans --rmi local` (matches chat)
2. **`package.json` check script** — Already `tko check --default-all`
3. **`package.json` format script** — Already `oxfmt`
4. **`package.json` upgradeSets** — Already present (missing only `drizzle` group)
5. **`package.json` bun 1.3.9** — Already `"packageManager": "bun@1.3.9"`
6. **ensureZeroPublication inside onMigrationComplete** — Already correctly placed
7. **node:24** base in Dockerfile — Already `FROM node:24-slim`
8. **CI timeout-minutes: 25** — Already set
9. **docker-compose zero port variable** — Already `"${VITE_PORT_ZERO:-4848}:4848"`

## Missing Dependencies

### For drizzle v1 beta upgrade:
- `drizzle-orm`: `^0.40.0` -> `1.0.0-beta.9-e89174b`
- `drizzle-kit`: `^0.30.5` -> `1.0.0-beta.9-e89174b`
- Must also update `@take-out/postgres` devDep which pins `"drizzle-orm": "^0.40.0"`

### For .oxlintrc.json changes:
- `scripts/check/helpers/ssr-guards.js` (new file needed)
- `scripts/check/helpers/script-imports.js` (new file needed)
- `scripts/check/helpers/middleware-imports.js` (new file needed)
- Verify oxlint version supports `jsPlugins` and `typescript` plugin (takeout has `"oxlint": "^1.31.0"`)

### For pg.server.ts:
- `src/database/pool.ts` must exist first (replaces database.ts)
- drizzle v1 beta must be installed first

### For docker migrate service removal:
- `scripts/dev/migrate.ts` must be created first
- `package.json` scripts `backend`, `backend:migrate` etc must be updated

### For zero client improvements:
- `src/zero/storage.ts` + `storage.native.ts` must exist first
- `src/zero/batchUpdates.ts` + `batchUpdates.native.ts` must exist first
- `src/zero/helpers/showClientDataError.ts` must exist first

## Risk Assessment

| Item | Risk | Rationale |
|------|------|-----------|
| drizzle v1 beta upgrade | **HIGH** | Breaking API changes across relations, migrations, query patterns. Must test thoroughly. |
| Zero 0.26.x upgrade | **HIGH** | API changes in server mutations, new params. Needs `on-zero` package compatibility verified. |
| `.oxlintrc.json` typescript plugin | **MEDIUM** | Will surface many new lint errors. Beneficial but requires cleanup pass. |
| Dockerfile multi-stage build | **MEDIUM** | Production deployment change. Must test docker build + deploy. |
| docker-compose migrate removal | **MEDIUM** | Changes dev workflow. Requires native migrate script + updated backend scripts. |
| `.oxfmtrc.jsonc` API rename | **LOW-MEDIUM** | Needs oxfmt version check. If supported, reformats all files (large diff but mechanical). |
| docker-compose postgres tuning | **LOW** | Additive. Tuning flags are sensible defaults. |
| docker-compose zero env scoping | **LOW** | Removes env_file leak. Just needs correct var list. |
| tsconfig.json changes | **LOW** | May surface hidden type errors in packages. |
| database/pool.ts | **LOW** | Better error handling. Drop-in replacement for database.ts. |
| init.sql zero databases | **LOW** | Additive. Just creates databases that may already exist. |
| database/.gitignore | **LOW** | Additive. Just adds `dist/`. |
| clearClientData ordering fix | **LOW** | Minor fix — close before delete. |
| zero/storage.ts + batchUpdates.ts | **LOW** | New files, no conflicts. |
| zero/helpers/showClientDataError.ts | **LOW** | New file, no conflicts. |
| zero/mutate.ts | **LOW** | New file, no conflicts. |
| playwright.config.ts improvements | **LOW** | Better defaults, no functional change. |
| CI workflow_dispatch trigger | **LOW** | Additive. |
| packages — server-only guard | **LOW** | Trivial one-line change. |
| scripts/check/helpers/*.js | **LOW** | New files, additive. |

## Precise Diffs Needed

### 1. init.sql — Add zero databases

**File**: `/Users/n8/takeout/src/database/init.sql`

Before:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

After:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- zero-cache databases (cvr + change tracking)
CREATE DATABASE zero_cvr;
CREATE DATABASE zero_cdb;
```

### 2. database/.gitignore — Add dist/

**File**: `/Users/n8/takeout/src/database/.gitignore`

Before:
```
migrate-dist.js
```

After:
```
dist/
migrate-dist.js
```

### 3. docker-compose.yml — Postgres tuning flags

**File**: `/Users/n8/takeout/docker-compose.yml`

Add after `-c max_connections=256`:
```yaml
      -c log_error_verbosity=terse
      -c log_min_messages=fatal
      -c idle_in_transaction_session_timeout=300000
      -c statement_timeout=60000
      -c tcp_keepalives_idle=60
      -c tcp_keepalives_interval=10
      -c tcp_keepalives_count=3
```

And update the debug comments to remove the now-redundant `log_error_verbosity=default` and `log_min_messages=info` suggestions.

### 4. docker-compose.yml — Zero service env scoping

**File**: `/Users/n8/takeout/docker-compose.yml`

Before (zero service):
```yaml
    env_file: .env
    ...
    environment:
      - ZERO_UPSTREAM_DB=...
      - ZERO_CVR_DB=...
      - ZERO_CHANGE_DB=...
      - ZERO_MUTATE_URL=...
      - ZERO_QUERY_URL=...
      - ZERO_ADMIN_PASSWORD=dev
```

After:
```yaml
    environment:
      ZERO_LOG_LEVEL: ${ZERO_LOG_LEVEL-warn}
      ZERO_UPSTREAM_DB: postgresql://user:password@pgdb:5432/postgres
      ZERO_CVR_DB: postgresql://user:password@pgdb:5432/zero_cvr
      ZERO_CHANGE_DB: postgresql://user:password@pgdb:5432/zero_cdb
      ZERO_MUTATE_URL: http://host.docker.internal:${VITE_PORT_WEB:-8081}/api/zero/push
      ZERO_QUERY_URL: http://host.docker.internal:${VITE_PORT_WEB:-8081}/api/zero/pull
      ZERO_ADMIN_PASSWORD: 'dev'
      ZERO_APP_PUBLICATIONS: ${ZERO_APP_PUBLICATIONS:-zero_takeout}
      ZERO_CVR_MAX_CONNS: ${ZERO_CVR_MAX_CONNS:-4}
      ZERO_MUTATE_FORWARD_COOKIES: ${ZERO_MUTATE_FORWARD_COOKIES:-true}
      ZERO_QUERY_FORWARD_COOKIES: ${ZERO_QUERY_FORWARD_COOKIES:-true}
      ZERO_UPSTREAM_MAX_CONNS: ${ZERO_UPSTREAM_MAX_CONNS:-8}
      ZERO_VERSION: ${ZERO_VERSION:-0.25.12}
```

(Remove `env_file: .env` line)

### 5. clearClientData.ts — Close before delete

**File**: `/Users/n8/takeout/src/zero/helpers/clearClientData.ts`

Move the `zero.close()` block from after IndexedDB deletion (line 57-59) to the very beginning of the try block (before `const databases = await indexedDB.databases()`):

Before:
```typescript
export const clearClientData = async () => {
  try {
    // Get all IndexedDB databases
    const databases = await indexedDB.databases()
    ...
    // Close the zero connection before reloading
    if (zero && typeof (zero as any).close === 'function') {
      await (zero as any).close()
    }
```

After:
```typescript
export const clearClientData = async () => {
  try {
    // close zero gracefully so pending mutations can flush
    if (zero && typeof zero.close === 'function') {
      await zero.close().catch(() => {})
    }

    // Get all IndexedDB databases
    const databases = await indexedDB.databases()
    ...
    // (remove old zero.close block from below)
```

### 6. .oxfmtrc.jsonc — API update

**File**: `/Users/n8/takeout/.oxfmtrc.jsonc`

Key changes:
- `"trailingComma": "es5"` -> `"trailingComma": "all"`
- `"experimentalSortImports"` -> `"sortImports"`
- `"side-effect"` -> `"side_effect"`, `"side-effect-style"` -> `"side_effect_style"`
- Collapse 6 type groups to single `["type"]`
- `"newlinesBetween": true` -> `"newlinesBetween": false`
- Remove `"order": "asc"` and `"ignoreCase": true`
- Remove `"**/migrate-dist.js"` from ignorePatterns
- Add `"**/*.generated.**"` to ignorePatterns
- Remove `"**/tsconfig.json"`, `"**/bun.lock"`, `"**/*.lock"` (chat doesn't have these)

### 7. package.json — upgradeSets addition

**File**: `/Users/n8/takeout/package.json`

Add to `upgradeSets`:
```json
"drizzle": [
  "drizzle-orm",
  "drizzle-kit"
],
```

Remove from `engines`:
```json
"npm": "10.8.3"
```

Add to `trustedDependencies`:
```json
"oxc-parser"
```

### 8. migrate.ts — Dynamic PRIVATE_TABLES derivation

**File**: `/Users/n8/takeout/src/database/migrate.ts`

Before:
```typescript
import { getDBClient } from '@take-out/postgres/getDBClient'
import { migrate } from '@take-out/postgres/migrate'

import { ZERO_CHANGE_DB, ZERO_CVR_DB, ZERO_UPSTREAM_DB } from '~/server/env-server'

const migrationsTS = import.meta.glob(`./migrations/*.ts`)

...

const PRIVATE_TABLES = [
  'user',
  'account',
  'session',
  'jwks',
  'verification',
  'whitelist',
  'migrations',
]
```

After:
```typescript
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { getDBClient } from '@take-out/postgres/getDBClient'
import { migrate } from '@take-out/postgres/migrate'
import { getTableName } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import * as schemaPrivate from './schema-private'

import { ZERO_CHANGE_DB, ZERO_CVR_DB, ZERO_UPSTREAM_DB } from '~/server/env-server'

// build migrations glob compatible with @take-out/postgres/migrate
// replaces import.meta.glob which is vite-only
const migrationsDir = join(import.meta.dirname, 'migrations')
const migrationsTS: Record<string, () => Promise<unknown>> = {}
for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.ts'))) {
  const path = `./migrations/${file}`
  migrationsTS[path] = () => import(join(migrationsDir, file))
}

...

// derive private table names from schema-private.ts - no manual list to maintain
const PRIVATE_TABLES = Object.values(schemaPrivate)
  .filter((v) => v instanceof PgTable)
  .map((t) => getTableName(t))
```

NOTE: The `readdirSync` approach also fixes the vite build-time evaluation issue with `import.meta.glob`.

### 9. playwright.config.ts — CPU-based workers + CI timeout

**File**: `/Users/n8/takeout/src/test/playwright.config.ts`

Before:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './integration',
  outputDir: './integration/.output/test-results',
  timeout: 30 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  retries: 1,
  // workers: process.env.CI ? '50%' : undefined,
  maxFailures: 1,
  reporter: 'list',
```

After:
```typescript
import { cpus } from 'node:os'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './integration',
  outputDir: './integration/.output/test-results',
  timeout: process.env.CI ? 60 * 1000 : 20 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  workers: process.env.CI ? 1 : Math.min(4, Math.floor(cpus().length * 0.5)),
  retries: 1,
  maxFailures: 3,
  reporter: 'list',
```

### 10. CI workflow — Add workflow_dispatch

**File**: `/Users/n8/takeout/.github/workflows/ci.yml`

Before:
```yaml
on:
  push:
    branches:
      - '**'
```

After:
```yaml
on:
  workflow_dispatch:
  push:
    branches:
      - '**'
```
