# Zero & Database Changes Analysis

## Summary

Major upgrades and structural changes across the zero/database layer since Jan 22.

## Zero Version & Config Changes

### Dependency Upgrades (Breaking)
- **drizzle-orm/drizzle-kit**: `^0.40.0` → `1.0.0-beta.9` — major breaking upgrade requiring new `defineRelations` API, new migration directory format, new `drizzle({ client, schema, relations })` call signature, and v2 RQB query style (`pg.query.table.findFirst()` instead of `.select().from().where()`)
- **@rocicorp/zero**: `0.25.12` → `0.26.1` — new `defaultAllowAdminRole` param; `zeroServer.transaction` removed; `zeroServer.mutate` now takes `{ authData }` options; `{ scalar: true }` on `.exists()` in nested permission queries is broken in 0.26.1 (added and immediately reverted in chat)

## Permission System Changes

- `where/server.ts` — significantly richer permission helpers using denormalized boolean columns on `userRole` instead of nested junction EXISTS (better Zero IVM performance)
- Key additions: `hasServerOwnerPermission`, `hasServerAdminPermission`, `hasServerMemberPermission`, `hasServerReadPermission`, + role-specific variants
- New `where/message.ts` and `where/data.ts` — message read permission + data view/edit role checks

## Schema/Migration Infrastructure

- `scripts/migrate/sync-drizzle.ts` (new) — bridges drizzle v1 beta directory migrations to flat `.ts` wrappers
- `scripts/migrate/generate.ts` — updated to detect interactive prompts and call sync-drizzle
- `src/database/relations.ts` — merge separate relations files into single file using new `defineRelations()` API
- Declarative trigger infrastructure — `src/database/triggers/ensureTriggers.ts` registry + hook in migrate.ts

## SYNC - Direct Apply

1. `src/database/init.sql` — add `CREATE DATABASE zero_cvr; CREATE DATABASE zero_cdb;`
2. `src/database/pool.ts` (new) — replaces `database.ts`; adds hardened error handlers including pg-protocol parser crash patch, keepAlive, explicit error.message+stack logging
3. `src/database/helpers.ts` — fix import to `@take-out/postgres/createServerHelpers` subpath; use `pool`
4. `src/database/.gitignore` — add `dist/`
5. `scripts/migrate/sync-drizzle.ts` (new) — bridges drizzle v1 beta directory migrations to flat `.ts` wrappers
6. `scripts/migrate/generate.ts` — updated to detect interactive prompts and call sync-drizzle
7. `src/zero/storage.ts` + `storage.native.ts` — `createKVStore(userId)` with per-user idb; native uses op-sqlite
8. `src/zero/batchUpdates.ts` + `batchUpdates.native.ts` — platform-split React batch updates
9. `src/zero/helpers/showClientDataError.ts` (new) — deduplicating error display with Reload+Reset actions
10. `src/zero/helpers/clearClientData.ts` — call `zero.close()` before deleting IndexedDB
11. `src/zero/helpers/setupClientGlobalEffects.ts` — simplified, uses new showClientDataError
12. `src/zero/mutate.ts` (new) — typed proxy around `zero.mutate` with error handling, 90s timeout, `.onError()` override

## ADAPT - Needs Modification

1. `src/database/pg.server.ts` — global drizzle instance + typed `insertRow/updateRow/deleteRow` helpers + `PgTimestampString` epoch-ms patch + `WithSQL<T>` type; needs takeout schema wired in
2. `src/database/migrate.ts` — complete rewrite: `readdirSync` migration glob, incremental `ensureZeroPublication` (add/remove tables surgically, derive PRIVATE_TABLES dynamically from schema-private via drizzle introspection, handle race condition), `onMigrationComplete` hook, stdio flush on exit, env from `process.env` directly
3. `src/database/relations.ts` — merge separate relations files into single file using new `defineRelations()` API
4. `src/zero/client.tsx` — stable auth ref, session token auth, error callbacks, connection monitor, `zeroDisabledByError` state
5. `src/zero/zeroServer.ts` — add `defaultAllowAdminRole: 'all'`; rename from `server.ts`; fix env import path
6. Declarative trigger infrastructure — `src/database/triggers/ensureTriggers.ts` registry + hook in migrate.ts (chat triggers themselves are SKIP)

## SKIP - App-Specific

- All migrations past initial schema
- schema-public.ts additions (chat-specific tables)
- All trigger content (chat-specific triggers)
- Virtual-list system
- Publication name `zero_chat` (takeout uses `zero_takeout`)
- Specific permission rules for chat tables

## Critical Bug Found

`ensureZeroPublication` must run inside `onMigrationComplete` callback — `migrate()` calls `process.exit(0)` after the callback returns, so code placed after `migrate()` never executes. The takeout version places `ensureZeroPublication()` after `migrate()` which means it never runs on deploy.

## Key Dependencies

- drizzle v1 beta upgrade is prerequisite for relations.ts changes
- Zero 0.26.x upgrade is prerequisite for permission and server changes
- `src/database/pool.ts` is prerequisite for pg.server.ts
- `scripts/migrate/` scripts depend on new drizzle version

## Recommended Order

1. Upgrade drizzle-orm/drizzle-kit to v1 beta
2. Upgrade @rocicorp/zero to 0.26.1
3. Add src/database/init.sql, pool.ts, .gitignore
4. Update src/database/helpers.ts
5. Rewrite src/database/migrate.ts (fix critical bug)
6. Add pg.server.ts (adapted)
7. Update src/zero/ client, server, storage, helpers
8. Add scripts/migrate/ tooling
9. Update relations.ts to use defineRelations
10. Add trigger infrastructure (optional)
