# Deploy, Data Layer & Features Analysis

## Summary

Deploy infrastructure significantly improved with rollback support and health checks. Data layer moved to drizzle v1 patterns. Several generic features worth porting.

## Uncloud/Deploy Changes

**docker-compose.yml (ADAPT):**
- Chat removed the `migrate` service entirely — migrations now run via `docker exec` in the deploy script. This avoids a health-check race condition.
- New `src/uncloud/init-db.sql` file with explicit `CREATE DATABASE zero_cvr/zero_cdb` — replaces mounting the entire `src/database/` directory.
- Zero tuning vars added: `ZERO_REPLICA_PAGE_CACHE_SIZE_KIB` (256MB), `ZERO_WEBSOCKET_COMPRESSION`, `ZERO_YIELD_THRESHOLD_MS`, OTEL→PostHog integration, slow query thresholds.
- `GIT_SHA` added to app-env (feeds health endpoint + smoke test).
- pgdb gets TCP keepalives + postgres performance tuning (`shared_buffers`, timeouts, etc.).

**New deploy scripts in chat (not in takeout):**
- `backup-db.ts` — SSH + pg_dump + scp to local
- `bootstrap-node.ts` — automate adding a new node to uncloud cluster
- `health.ts` — container status dashboard with metrics
- `setup-backups.ts` — installs cron backup script with R2 replication on server
- `smoke-test.ts` — 4-step post-deploy check: health endpoint, zero endpoint, HTML, optional browser auth + message send

**Key new pattern:** `scripts/uncloud/helpers/deploy.ts` adds `runDeploymentWithRollback()` — deploys, runs health+smoke check, and on failure: tags `:previous` image back to `:latest`, re-deploys, then throws CI failure to flag the broken build. This is directly applicable to the template.

## Upload Changes

Import paths changed from `~/server/env-server` → `~/constants/env-server`. Dev Bunny mock URL now uses `VITE_PORT_WEB` (not hardcoded 3333). Small fixes only.

## Data Layer Infrastructure Changes

1. **`on-zero` rename** — all `over-zero` imports updated. Verify template already has this.
2. **`syncedMutations.ts`** — new auto-generated file from `bun on-zero generate`. Exports valibot validators for every mutation arg. No manual sync needed — regeneration produces it.
3. **`syncedQueries.ts` API** — switched from `syncedQuery` to `defineQuery`/`defineQueries` (Zero 0.26+).
4. **`schema.ts`** — remove `enableLegacyQueries: true` (Zero 0.26 change).
5. **`createServerActions.server.ts`** — renamed from `.ts` to `.server.ts`, added `'server-only'`, restructured to namespaces (`pg`, `search`, `thread`, `data`, `flow`, `email`, `notification`, `realtime`, `ai`, etc.).
6. **`initializeZeroMigrations.ts`** + **`migrations.ts`** — migrated from raw drizzle `db` / `zeroServer.transaction + batchQuery` to `pg.query.*` pattern.
7. **`src/data/where/server.ts`** — significantly richer permission helpers using denormalized boolean columns on `userRole` instead of nested junction EXISTS (better Zero IVM performance). Key additions: `hasServerOwnerPermission`, `hasServerAdminPermission`, `hasServerMemberPermission`, `hasServerReadPermission`, + role-specific variants.
8. **New `where/message.ts`** and **`where/data.ts`** — message read permission + data view/edit role checks.
9. **`server-effects/` pattern** — new sub-tree (~3000 lines) for post-mutation async side effects. Chat-specific content but the pattern (pure effect functions composed by a coordinator, `server-only`, called after mutation commits) is worth documenting in the template.

## Features - Shared

### SYNC - Direct Apply

- **`analytics/trackSlowQueries.ts`** — Zero inspector integration to report slow queries to PostHog. Fully generic.
- **`errors/`** — simplified, removed dead interfaces and dev-mode bypass.
- **`logger/`** — `debug` case fix to prevent fallthrough.
- **`shortcuts/ShortcutBadge.tsx`** — three generic keyboard shortcut UI components.
- **`storage/setupStorage.ts` + `.native.ts`** — MMKV driver setup for native.
- **`push-notifications/server/sendApnsNotification.ts`** — fixes error handler registration order (client-level before request).
- **`user/RedirectUserToLastPage.ts`** — uses `createStorageValue` + `publicPrefixRegex`, removed native duplicate file.

### ADAPT - Needs Modification

- **Deploy rollback pattern** (`runDeploymentWithRollback`) — needs takeout's deploy config wired in
- **Smoke test** — needs app-specific health/zero URLs
- **`createServerActions.server.ts`** — `.server.ts` rename + `server-only` pattern is good; namespace structure needs takeout's actions
- **`syncedQueries.ts`** — `defineQuery`/`defineQueries` API migration; takeout's specific queries differ

### SKIP - App-Specific

- All chat-specific features (channels, messages, threads, AI, flows, etc.)
- `server-effects/` content (chat triggers/side-effects)
- `where/message.ts`, `where/data.ts` (chat permission rules)
- backup-db.ts, bootstrap-node.ts, setup-backups.ts (chat infrastructure specific)

## Key Dependencies

- Deploy rollback requires health endpoint changes first
- Data layer changes require drizzle v1 + Zero 0.26 upgrades
- `syncedQueries.ts` API change requires `on-zero` package update
- `createServerActions.server.ts` requires `server-only` package
