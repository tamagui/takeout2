# Takeout ← Chat Sync Plan

> Syncing improvements from ~/chat (upstream, 2283 commits since Jan 22 2026) into ~/takeout (template repo).
> Generated 2026-03-21 after 8 parallel analysis agents + 3 Opus validation agents.

## Already Applied (No Action Needed)

These items were independently implemented in takeout — skip them:

1. `package.json` backend:clean command
2. `package.json` check script (`tko check --default-all`)
3. `package.json` format script (`oxfmt`)
4. `package.json` bun 1.3.9
5. `package.json` upgradeSets structure (missing only `drizzle` group)
6. Dockerfile node:24-slim base
7. CI timeout-minutes: 25
8. docker-compose zero port variable
9. docker-compose named volumes
10. `ensureZeroPublication` inside `onMigrationComplete` callback (critical bug already fixed)
11. `defineQuery`/`defineQueries` API in syncedQueries.ts
12. `enableLegacyQueries: false` in schema.ts
13. `AuthData` type includes `email` field
14. `@better-fetch/fetch` dependency installed
15. `valibot` dependency installed
16. `on-zero` rename (was `over-zero`)
17. Deploy rollback (`runDeploymentWithRollback`)

---

## Phase 1: Safe, Zero-Conflict Changes (LOW RISK)

New files with no dependencies, bug fixes, additive config. Can be done in a single PR.

### 1.1 New Utility Files (copy from chat)

| # | File to create | Source | Notes |
|---|----------------|--------|-------|
| 1 | `src/helpers/formatDuration.ts` | `~/chat/src/helpers/formatDuration.ts` | Zero deps |
| 2 | `src/helpers/color/extractOpacityFromColor.ts` | `~/chat/src/helpers/color/extractOpacityFromColor.ts` | Create `color/` dir, zero deps |
| 3 | `src/tamagui/opacify.ts` | `~/chat/src/tamagui/opacify.ts` | Only tamagui types |
| 4 | `src/tamagui/breakpoints.ts` | `~/chat/src/tamagui/breakpoints.ts` | Zero deps |
| 5 | `src/interface/sizes.ts` | `~/chat/src/interface/sizes.ts` | Zero deps |
| 6 | `src/interface/dividers/Separator.tsx` | `~/chat/src/interface/dividers/Separator.tsx` | Create dir, only tamagui |
| 7 | `src/interface/notice/Notice.tsx` | `~/chat/src/interface/notice/Notice.tsx` | Create dir, only tamagui |
| 8 | `src/interface/utils/RenderChildrenWhenIdle.tsx` | `~/chat/src/interface/utils/RenderChildrenWhenIdle.tsx` | Depends on `@take-out/helpers` (available) |
| 9 | `app/+not-found.tsx` | Adapted from chat | Simple 404 page |
| 10 | `app/api/geo+api.tsx` | `~/chat/app/api/geo+api.tsx` | Cloudflare geo/GDPR helper, no app deps |

### 1.2 Bug Fixes

| # | File | Change |
|---|------|--------|
| 11 | `src/helpers/storage/clearAllDataAndStorages.ts` | `deleteReq.error` null guard: `deleteReq.error ?? new Error('failed to delete database')` |
| 12 | `src/helpers/storage/clearAllDataAndStorages.ts` | `substr` → `substring` |
| 13 | `src/zero/helpers/clearClientData.ts` | Move `zero.close()` BEFORE IndexedDB deletion (flush pending mutations first) |
| 14 | `src/features/logger/logger.ts` | Add `case 'debug': { // nothing }` to prevent switch fallthrough |

### 1.3 Small Improvements

| # | File | Change |
|---|------|--------|
| 15 | `src/server/getIsAdmin.ts` | Make `authData` param optional: `(authData?: AuthData \| null)` |
| 16 | `src/features/auth/constants.ts` | Add `CAN_ADMIN_BYPASS` constant |
| 17 | `src/features/auth/server/authServer.ts` | Add `logger: { level: 'warn' }` config |
| 18 | `src/interface/animations/animationClamped.ts` | Add missing spring keys: `bouncy`, `superBouncy`, `medium`, `slow`, `slowest`, `lazy`, `superLazy` |

### 1.4 Config Tweaks

| # | File | Change |
|---|------|--------|
| 19 | `package.json` | Remove `"npm": "10.8.3"` from engines |
| 20 | `package.json` | Add `"oxc-parser"` to trustedDependencies |
| 21 | `package.json` | Add `"drizzle": ["drizzle-orm", "drizzle-kit"]` to upgradeSets |
| 22 | `package.json` | Add `dev:fresh` script: `"bun backend:clean; bun dev --clean"` |
| 23 | `src/database/.gitignore` | Add `dist/` |
| 24 | `src/database/init.sql` | Add `CREATE DATABASE zero_cvr; CREATE DATABASE zero_cdb;` |
| 25 | `.github/workflows/ci.yml` | Add `workflow_dispatch:` trigger |

### Verification
```bash
bun check
```

---

## Phase 2: Infrastructure Upgrades (LOW-MEDIUM RISK)

Config file updates and docker improvements. Should be a separate PR, tested with `bun backend:clean && bun backend && bun dev`.

### 2.1 Linting & Formatting Config

| # | File | Change |
|---|------|--------|
| 26 | `.oxfmtrc.jsonc` | `experimentalSortImports` → `sortImports`; `side-effect` → `side_effect`; collapse type groups; `trailingComma: "all"`; `newlinesBetween: false`; remove `order`/`ignoreCase`; update ignore patterns |
| 27 | Add `scripts/check/helpers/ssr-guards.js` | Copy from chat — generic oxlint plugin |
| 28 | Add `scripts/check/helpers/script-imports.js` | Copy from chat — enforces `cmd` import pattern |
| 29 | Add `scripts/check/helpers/middleware-imports.js` | Copy from chat — enforces lazy middleware imports |
| 30 | `.oxlintrc.json` | Add `"typescript"` plugin; add 14 typescript rules; add `react/jsx-no-constructed-context-values`; add jsPlugins array pointing to helpers/; update ignore patterns |

**WARNING**: Adding the typescript plugin will surface many new lint errors. Run `bun lint:fix` and fix remaining errors manually.

### 2.2 TypeScript Config

| # | File | Change |
|---|------|--------|
| 31 | `tsconfig.json` | Add `"./packages"` to include; remove from exclude; remove explicit `false` for `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`; add `"**/dist"` to exclude |

### 2.3 Playwright Config

| # | File | Change |
|---|------|--------|
| 32 | `src/test/playwright.config.ts` | CPU-based workers (`Math.min(4, Math.floor(cpus().length * 0.5))`); CI: 1 worker + 60s timeout; local: 20s timeout; `fullyParallel: true`; `maxFailures: 3` |

### 2.4 Docker

| # | File | Change |
|---|------|--------|
| 33 | `docker-compose.yml` | Add 7 postgres tuning flags (keepalives, timeouts, log verbosity) |
| 34 | `docker-compose.yml` | Zero service: remove `env_file: .env`, switch to explicit env vars with defaults |
| 35 | `Dockerfile` | Multi-stage build: `bun-base` → `prod-deps` → `runtime`; `COPY --from=oven/bun:1.3.9` instead of curl install |

### 2.5 CI

| # | File | Change |
|---|------|--------|
| 36 | `.github/workflows/ci.yml` | Move `concurrency` from workflow-level to deploy-job only (prevents stale deploy cancellation from killing test jobs) |
| 37 | `.github/actions/install/action.yml` | Add `libreadline-dev` system dep; add `packages/*/dist` build cache |

### Verification
```bash
bun lint:fix && bun tko check types
bun backend:clean && bun backend  # test docker changes
docker build .  # test Dockerfile
```

---

## Phase 3: Database & Zero Layer (HIGH RISK)

Major dependency upgrades. **Must be thoroughly tested.** Separate PR, possibly broken into sub-PRs.

### 3.1 Database Pool Hardening (do first, independent of upgrades)

| # | File | Change |
|---|------|--------|
| 38 | Add `src/database/pool.ts` | Copy from chat, adapt: hardened error handlers, pg-protocol stream patch, keepAlive, max/timeout settings. This replaces `database.ts` |
| 39 | Update `src/database/helpers.ts` | Import from `@take-out/postgres/createServerHelpers` (subpath) + use new pool |

### 3.2 Zero 0.26 Upgrade

| # | Action |
|---|--------|
| 40 | `bun add @rocicorp/zero@0.26.1` |
| 41 | Update `src/zero/server.ts` → rename to `zeroServer.ts`; add `defaultAllowAdminRole: 'all'` |
| 42 | Update `src/data/schema.ts` — remove `enableLegacyQueries` line entirely; add `createBuilder` if needed |
| 43 | Verify all zero queries/mutations still work |

### 3.3 Drizzle v1 Beta Upgrade

| # | Action |
|---|--------|
| 44 | `bun add drizzle-orm@1.0.0-beta.9-e89174b drizzle-kit@1.0.0-beta.9-e89174b` |
| 45 | Also update `@take-out/postgres` if it pins drizzle |
| 46 | Add `scripts/migrate/sync-drizzle.ts` — bridges directory migrations to flat wrappers |
| 47 | Merge `relations-public.ts` + `relations-private.ts` → single `relations.ts` using `defineRelations()` API |
| 48 | Update `src/database/migrate.ts` — switch to `readdirSync` migration glob; derive PRIVATE_TABLES dynamically from schema-private |

### 3.4 New Zero Client Improvements

| # | File | Change |
|---|------|--------|
| 49 | Add `src/zero/storage.ts` + `storage.native.ts` | Per-user KV store with idb/op-sqlite |
| 50 | Add `src/zero/batchUpdates.ts` + `batchUpdates.native.ts` | Platform-split React batch updates |
| 51 | Add `src/zero/helpers/showClientDataError.ts` | Deduplicating error display with Reload/Reset |
| 52 | Add `src/zero/mutate.ts` | Typed proxy with error handling + 90s timeout |
| 53 | Update `src/zero/client.tsx` | Stable auth ref, session token auth, error callbacks, connection monitor |

### 3.5 Optional: pg.server.ts (requires drizzle v1)

| # | File | Change |
|---|------|--------|
| 54 | Add `src/database/pg.server.ts` | Global drizzle instance + typed `insertRow`/`updateRow`/`deleteRow` helpers; adapt for takeout schema |

### Verification
```bash
bun db:migrate  # test migration system
bun dev  # test zero sync
bun ops release --dry-run  # full integration test
```

---

## Phase 4: Auth & Server Improvements (MEDIUM RISK)

Incremental auth hardening. Each change should be individually testable.

### 4.1 Safe Auth Changes

| # | File | Change |
|---|------|--------|
| 55 | `src/features/auth/server/ensureAuth.ts` | Add `ADMIN_WHITELIST` check alongside role check; distinguish 401 (unauthenticated) vs 403 (forbidden) |
| 56 | `app/api/health+api.ts` | Add migration count, GIT_SHA, env to health response (lazy-import pg) |
| 57 | `src/uncloud/docker-compose.yml` | Add `GIT_SHA: ${GIT_SHA:-unknown}` to x-app-env |

### 4.2 Auth Hardening (needs testing with real auth flows)

| # | File | Change | Risk |
|---|------|--------|------|
| 58 | `authServer.ts` | `crossSubDomainCookies` conditioned on `SERVER_IS_PRODUCTION_HOST` | LOW |
| 59 | `authServer.ts` | JWT expiration `3y` → `7d` (compromise: not as aggressive as `1d`) | **MEDIUM — will expire sessions** |
| 60 | `authServer.ts` | Remove `emailHarmony` (known bug: user created without credential → 422/401) | MEDIUM |

### 4.3 Middleware Improvement

| # | File | Change |
|---|------|--------|
| 61 | `app/_middleware.ts` | Extract `trackApiError()` function; lazy analytics import; type-only middleware import |

### 4.4 New Auth Utilities (optional, for future API support)

| # | File | Change |
|---|------|--------|
| 62 | Add `src/features/auth/server/validateToken.ts` | JWT JWKS validation via `jose` (add `bun add jose` first) |
| 63 | Add `src/features/auth/server/getJWTRequestCookie.ts` | Cookie parser helper |
| 64 | Add `src/features/auth/server/getRequestUser.ts` | JWT-first fast auth path |

### 4.5 API Framework (optional, larger effort)

| # | File | Change |
|---|------|--------|
| 65 | Add `src/features/api/types.ts` | Error codes, endpoint types, response types |
| 66 | Add `src/features/api/errors.ts` | Postgres error classification |
| 67 | Add `src/features/api/response.ts` | `successResponse`/`errorResponse` helpers |
| 68 | Add `src/features/api/generateApiKey.ts` | `sk_live_` key generation |
| 69 | Add `src/features/api/rateLimit.ts` | In-memory sliding window rate limiter |

### Verification
```bash
bun dev  # test auth flows manually
# Login, logout, session persistence, admin access
```

---

## Phase 5: UI Components (MEDIUM-HIGH RISK)

Visual changes. Each needs manual visual verification.

### 5.1 Safe Component Additions

| # | File | Source |
|---|------|--------|
| 70 | Add `src/interface/scroll/FadedContent.tsx` | Copy from chat (337 lines, composable mask-image fade scroll) |
| 71 | Add `src/interface/utils/ErrorBoundary.tsx` | Copy from chat (deps: handleError, showNotification — both available) |
| 72 | Add `src/interface/pill/Pill.tsx` | Copy from chat (depends on Tooltip) |

### 5.2 Component Refactors (visual impact)

| # | File | Change | Risk |
|---|------|--------|------|
| 73 | `src/interface/effects/Glint.tsx` | Named export; `$highlight1` border; `$platform-native` variant; z-index bump; update 4 import sites | MEDIUM |
| 74 | `src/interface/tooltip/Tooltip.tsx` | Dark glass style, `setAllTooltipsDisabled()`, memo; **visual change** | MEDIUM |

### 5.3 Major Refactors (DO WITH EXTREME CARE)

| # | Component | Key concern |
|---|-----------|-------------|
| 75 | **Button** | Chat removed ALL native support (glass, haptics, GlassView). **DO NOT blindly sync.** Cherry-pick: `action` prop, `memo()`, constants extraction. **KEEP** native glass/haptic code. |
| 76 | **Dialog** | Needs FadedContent + DialogStyledContext + Separator first. Chat removed `useHandleEscapeIf`. **KEEP** escape handling. Add variant system, shake animation. |
| 77 | **Menu types** | Type hierarchy (`MenuItem`, `MenuSeparator`, `MenuTitle`, type guards) is worth syncing. Skip `Menu.tsx` implementation (chat-specific). |

### 5.4 Theme Changes (VISUAL BREAKING CHANGE)

| # | File | Change | Risk |
|---|------|--------|------|
| 78 | `src/tamagui/themes.ts` | `v5` → `v5-subtle`; interpolated midpoint colors | **HIGH — changes colors across entire app** |
| 79 | `src/tamagui/tamagui.config.ts` | Custom media queries (`lg2` at 948px); dual animation driver | MEDIUM |
| 80 | Add `src/tamagui/animations.ts` | Dual-driver: `{ default: animationsMotion, css: animationsCSS }` | MEDIUM |

**Recommendation**: Theme changes should be a standalone PR with screenshot comparison testing before/after.

### Verification
```bash
bun dev  # visual inspection on web
# Check: buttons, dialogs, tooltips, glints, theme colors
```

---

## Phase 6: Deploy & Data Patterns (LOW-MEDIUM RISK)

### 6.1 Deploy Improvements

| # | File | Change |
|---|------|--------|
| 81 | Add `scripts/uncloud/smoke-test.ts` | Adapt from chat: 4-step post-deploy check (health, zero, HTML, optional auth) |
| 82 | `scripts/uncloud/helpers/deploy.ts` | Add smoke test call after health check in rollback flow |
| 83 | Add `scripts/db/psql.ts` | Generic psql connection, auto-detect dev/prod |
| 84 | Add `scripts/dev/migrate.ts` | Native migration runner with `waitForPostgres()` (adapt postgres port to 5433) |

### 6.2 Data Patterns

| # | File | Change |
|---|------|--------|
| 85 | `src/data/createServerActions.ts` | Rename to `.server.ts`; add `import 'server-only'` (install `server-only` pkg first) |
| 86 | Add `src/features/analytics/trackSlowQueries.ts` | Copy from chat — Zero inspector integration for PostHog |

### 6.3 Docker Migrate Service Removal (requires 84 first)

| # | File | Change |
|---|------|--------|
| 87 | `docker-compose.yml` | Remove `migrate` service; update `zero` depends_on to only `pgdb` |
| 88 | Update `package.json` backend script | Run native migration instead of docker migrate service |

### Verification
```bash
bun backend:clean && bun backend  # test native migration
bun dev  # verify zero still works
```

---

## Things to NOT Sync

| Area | Reason |
|------|--------|
| `app/(chat)/`, `app/(site)/` routes | Chat product routes |
| `src/features/` chat-specific features | Channels, messages, threads, AI, flows |
| `src/data/` specific models/schemas | Chat-specific tables and relations |
| `src/database/migrations/` | Chat-specific migrations |
| `src/database/triggers/` content | Chat-specific triggers (infrastructure pattern in Phase 3 is ok) |
| `packages/pipedown*`, `packages/openclaw*` | Chat-specific packages |
| `packages/markdown-to-jsx` | Chat-specific vendored fork |
| `src/start/` | Chat CLI/SDK |
| `src/tauri/` | Chat desktop app |
| `src/ingest/`, `src/jobs/` | Chat backend services |
| `scripts/ai/`, `scripts/api/`, `scripts/flow/` | Chat-specific tooling |
| Auth route move `(app)/auth/` → `auth/` | Would break takeout's auth guard flow |
| Remove `emailOTP`/`phoneNumber` plugins | Would break takeout login flows |
| PostHog feature flag removal | Would break takeout consumers |
| Button native support removal | Would break takeout native apps |
| Fonts (system stack, martian) | Intentionally app-specific |
| Chat-specific env vars (BUNNY_*, CLOUDFLARE_REALTIME_*, etc.) | App-specific |

---

## Dependency Installation Summary

```bash
# Phase 1 — nothing needed
# Phase 3
bun add @rocicorp/zero@0.26.1
bun add drizzle-orm@1.0.0-beta.9-e89174b drizzle-kit@1.0.0-beta.9-e89174b
# Phase 4
bun add jose  # for JWT validation
bun add server-only  # for .server.ts pattern
# Phase 5 — nothing needed (all tamagui deps already available)
```

---

## Execution Strategy

1. **Phase 1** → single PR, should be trivially safe. Run `bun check`.
2. **Phase 2** → single PR. Will generate large formatting diff from oxfmt changes. Run `bun lint:fix` after config updates. May need a pass to fix new typescript lint errors.
3. **Phase 3** → **most critical**. Consider sub-PRs: (3.1 pool hardening), (3.2+3.3 version upgrades + migration), (3.4+3.5 zero client). Full integration test after each.
4. **Phase 4** → can run in parallel with Phase 3 (auth changes are independent of zero/drizzle upgrades, except health endpoint which needs pg.server.ts).
5. **Phase 5** → **do last**, most visible impact. Theme changes especially need visual QA.
6. **Phase 6** → can run in parallel with Phase 5.

**Total estimated items**: 88 discrete changes across 6 phases.
