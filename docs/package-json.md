---
name: takeout-package-json
description: package.json structure — scripts, env vars, workspaces, monorepo, trustedDependencies.
---

# package.json

this project uses a single root package.json with workspaces for internal
packages. understanding its structure helps avoid common mistakes.

we use bun generally for scripts we write, and we try and create high level
groups for scripts that we then run with the `tko` helper.

## scripts section

scripts are minimal - most commands use the takeout cli (`tko`).

### patterns

**prefer `tko` over direct commands:**

```json
"check": "tko check",
"build": "tko run build",
"clean": "tko run clean"
```

**use `tko run` for parallel execution:**

```json
"dev": "tko run run one:dev watch dev-tunnel-if-exist"
```

### adding new scripts

shared scripts used by multiple Takeout apps live in `@o/scripts` in the Orez
repository. app-specific scripts live in `./scripts`.

example - adding a port check before dev:

```bash
# create the script
echo '#!/usr/bin/env bun
/**
 * @description Ensure a port is available
 */
// implementation...' > scripts/ensure-port.ts

# use via tko
bun tko ensure-port 8081
```

## env vars

environment variables are defined in `src/env.ts` using `createEnv` from
`@o/env`. the `envVars` export is the complete registry used by
`bun tko env:update` to sync CI yml, docker yml, and `.env` files.

- `expected` - required at runtime (no default)
- `"value"` - optional with default value
- `""` - optional, no default

**never modify `src/env.ts` without understanding the structure** - it drives
env sync across the project.

to add a new env var:

1. add to `envVars` in `src/env.ts` (or to the `base`/`production` sections of
   `createEnv` if the app needs it at runtime)
2. run `bun env:update`
3. optionally add example value to `.env.development`

## trustedDependencies

allow postinstall scripts for specific packages:

```json
"trustedDependencies": [
  "@rocicorp/zero-sqlite3"
]
```

## the zero / orez dependency set

four packages move together and one of them is deliberately behind:

- `orez` - the local backend CLI that `bun lite` runs (pglite, zero-cache, S3)
- `on-zero` - the query/mutation layer the app imports
- `drizzle-zero` - generates `src/data/generated/schema.ts` from the drizzle
  schema. it must be `drizzle-zero`, not `drizzle-zero-sqlite`; the sqlite build
  rejects `pgTable` and `bun zero:schema` fails with
  `Unsupported table type ... Only SQLite tables are supported`
- `orez-sync-executor` - **pinned to 0.13.2 on purpose.** it supplies the
  Postgres server-mutator path (`createPostgreSQLApplicationDatabase`,
  `createSyncExecutor`, `handleSyncExecutorPushRequest`) used by
  `src/zero/server.ts` and `app/api/zero/push+api.tsx`, and nothing else in the
  app imports it. orez deleted its PostgreSQL execution path in 0.14.0, so
  newer versions do not export `createPostgreSQLApplicationDatabase` and the
  build breaks.

  the `orez` CLI does not depend on this package at all. the 0.16.3 copies in
  the tree arrive through `on-zero` -> `orez-lite` -> `orez-sync-executor` and
  sit nested under `orez-lite` and `orez-sync-cf-host`; they are the sqlite
  sync engine and never touch the app's Postgres push path

do not bump `orez-sync-executor` until on-zero ships a supported Postgres
executor again, or the app moves to Zero's own `PushProcessor` from
`@rocicorp/zero/pg`.

## takeout section

project-specific metadata for onboarding script etc:

```json
"takeout": {
  "onboarded": false
}
```

## common mistakes

1. **adding scripts that should be in `./scripts/`** - if it's project-specific
   logic, put it in scripts folder

2. **modifying env sync outputs directly** - always update `envVars` in
   `src/env.ts` + `bun env:update`

3. **using full paths when tko works** - prefer `tko check types` over
   `bun ./scripts/check/types.ts`

4. **forgetting workspace:\* for internal packages** - always use `workspace:*`
   for packages in `./packages/*`
