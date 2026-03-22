# Infrastructure & Configuration Changes Analysis

## Summary

Between `8321f763e` and HEAD in `~/chat`, the infrastructure underwent significant evolution:
- **Docker**: Multi-stage Dockerfile; postgres tuning in docker-compose; native migrations replace Docker migrate service; zero service no longer leaks entire `.env`
- **CI/CD**: Split into `test` + `deploy` + `tauri-build` jobs; `workflow_dispatch` added; warp runners; stale deploy cancellation at job level
- **package.json**: bun bump to 1.3.9; scripts reorganised around `tko` CLI; `upgradeSets` added; `backend:clean` improved; `engines.npm` removed
- **tsconfig**: `packages` now included in type-checking; noisy explicit-false flags removed
- **oxlint/oxfmt**: Major API/rule expansion — `typescript` plugin, custom JS oxlint plugins, `sortImports` API rename
- **scripts/**: 129 files changed, mostly chat-specific but ~15 generic scripts worth syncing

## SYNC - Direct Apply

1. **`package.json`**: Remove `"npm": "10.8.3"` from `engines`; add `upgradeSets.drizzle` group; add `"oxc-parser"` to `trustedDependencies`

2. **`package.json` scripts**: `backend:clean` → `docker compose down --volumes --remove-orphans --rmi local` (improved); `check` → `tko check --default-all`; `dev:fresh` (new); `format` (new alias for oxfmt); `lint` → `tko check lint`; `generate` → `tko generate`

3. **`Dockerfile`**: Multi-stage build pattern — `bun-base` → `prod-deps` → `runtime`; bun copied from `oven/bun:1.3.9` official image (avoids flaky `curl | bash` installs); `node:24-slim` (was `node:22.4-slim`)

4. **`docker-compose.yml`** postgres command block: Add the 7 tuning flags (`log_error_verbosity=terse`, `log_min_messages=fatal`, `idle_in_transaction_session_timeout=300000`, `statement_timeout=60000`, tcp_keepalives x3)

5. **`docker-compose.yml`** zero service: Remove `env_file: .env`; switch to explicit env var list with sensible defaults; port configuration via `${VITE_PORT_ZERO:-4848}:4848`

6. **`tsconfig.json`**: Add `"./packages"` to `include`; remove it from `exclude`; remove explicit `false` values for `noUnusedLocals`, `noUnusedParameters`, `noImplicitAny`

7. **`.oxfmtrc.jsonc`**: `experimentalSortImports` → `sortImports` (API rename); group identifiers `side-effect` → `side_effect`; collapse type groups to single `"type"`; `trailingComma: "es5"` → `"all"`; `newlinesBetween: false`; remove `order`/`ignoreCase`; remove `**/migrate-dist.js` ignore; add `**/*.generated.**`

8. **`.oxlintrc.json`**: Add `"typescript"` plugin; add `react/jsx-no-constructed-context-values: "error"`; add 14 `typescript/` rules (no-for-in-array, no-array-delete, no-meaningless-void-operator, etc.); update ignore patterns (add `src/database/migrations/**`, `**/.claude/**`; remove `**/migrate-dist.js`)

9. **`scripts/check/helpers/ssr-guards.js`** (new): Generic oxlint plugin enforcing SSR guards in data models

10. **`scripts/check/helpers/script-imports.js`** (new): Enforces `cmd` import pattern in `scripts/**/*.ts`

11. **`scripts/check/helpers/middleware-imports.js`** (new): Enforces no top-level runtime imports in `_middleware.ts`

12. **`scripts/check/lint.ts`**: Updated to call `bun oxfmt` + `bun oxlint` (flags moved into `.oxlintrc.json`)

13. **`scripts/check/types.ts`**: Improved — supports filtering file args vs flags from `args.rest`

14. **`scripts/migrate/add.ts`**, **`run.ts`**, **`generate.ts`**, **`sync-drizzle.ts`** (all new): Clean `tko migrate` category replacing scattered `db:generate`/`db:migrate:add` aliases

15. **`scripts/db/psql.ts`** (new): Generic psql connection script, auto-detects dev vs prod

16. **`scripts/web/build.ts`** (new): Web build wrapper with `--kind` flag (release/test/manual)

17. **`scripts/ops/logs.ts`**: Updated to use `cmd` wrapper pattern

18. **`app.config.ts`**: `@take-out/takeout/withOpSqliteStatic` → `@take-out/cli/withOpSqliteStatic` (plugin moved packages)

19. **`.github/workflows/ci.yml`**: Add `workflow_dispatch:` trigger; increase timeout to 25 min; move `concurrency` from workflow-level to deploy-job-level only

20. **`.github/workflows/build-ios-app*.yml`**: Runner `[macOS, sequoia-xcode-beta]` → `warp-macos-15-arm64-6x`

21. **`playwright.config.ts`**: CPU-count-based worker calc (`Math.min(4, Math.floor(cpus().length * 0.5))`); CI 1 worker + 60s timeout; local 20s timeout; remove stale commented `webServer` block

## ADAPT - Needs Modification

**A1. Dockerfile — native module rebuilds**
Chat rebuilds `isolated-vm oxc-parser` for Linux and installs `@voidzero-dev/vite-plus-linux-x64-gnu@0.1.12`. `isolated-vm` is chat-specific (AI sandbox). Keep `oxc-parser` rebuild. Add vite-plus binding only if takeout uses vite-plus.

**A2. docker-compose — named volumes vs bind mounts**
Takeout recently fixed a permission issue by switching TO named volumes (commit `e2cde42f`). Chat went the opposite direction (bind mounts with `DOCKER_DATA_DIR`). **Keep named volumes in takeout** — the recent fix addresses a real problem and the bind-mount approach would regress it.

**A3. docker-compose — migrate service removal**
Chat removed the Docker `migrate` service; migrations now run natively. This is a clear improvement but requires `scripts/dev/migrate.ts` to exist first (a new script with `waitForPostgres()` logic). Apply together.

**A4. `.github/workflows/ci.yml` — job split structure**
The `test` + `deploy` + `tauri-build` split is good architecture but the env var lists are chat-specific. Use takeout's existing env var list (from current ci.yml) when adapting the job structure.

**A5. `.github/actions/install/action.yml`**
Chat removed `bun-version-file: 'package.json'`, added `libreadline-dev`, removed explicit `postinstall` step, added build cache for `packages/*/dist`, added `Generate Zero` step. The build cache is generic. The Zero generate may already happen in postinstall. The `libreadline-dev` is needed for psql scripts. The explicit postinstall removal is fine if bun runs it automatically.

**A6. `.oxlintrc.json` jsPlugins — `message-order.js`**
Chat-specific (enforces `createMessageOrder()` for chat message ordering). Skip.

**A7. `scripts/ops/ci-watch.ts`**
Hardcodes `https://start.chat` as default URL. Change to use `process.env.CI_WATCH_URL || process.env.VITE_PRODUCTION_HOSTNAME` before syncing.

**A8. `package.json` env section**
Chat added: `VITE_PRODUCTION_HOSTNAME`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `ZERO_APP_ID`, `ZERO_APP_PUBLICATIONS`, additional ZERO_* tunables. For takeout: add `VITE_PRODUCTION_HOSTNAME` (blank default), `ZERO_APP_ID` (generic, needed for multi-app), additional ZERO tunables (already partially present). Skip: hardcoded chat-specific IDs/URLs.

**A9. `scripts/dev/migrate.ts`**
New native migration runner with `waitForPostgres()`. The logic is generic; takeout needs this to replace the Docker migrate service. Adapt the postgres connection string to use takeout's defaults.

**A10. `scripts/postinstall.ts`**
Chat dropped the `@take-out/scripts/build-initial` call. Takeout still uses it. Verify if `build-initial` was folded into something else in the updated `@take-out/scripts` package before removing.

## SKIP - App-Specific

- `scripts/ai/` — AI chat CLI
- `scripts/api/` — SDK/OpenAPI/doc generation for chat's public API
- `scripts/cli/chat.ts` — chat CLI
- `scripts/dev/agent-gateway.ts`, `agent-mini1.ts` — AI agent services
- `scripts/dev/jobs.ts` — chat background jobs
- `scripts/flow/`, `scripts/flows/` — AI pipeline tools
- `scripts/blog/generate-images.tsx` — blog image generation
- `scripts/fonts/subset-martian.ts` — chat-specific font
- `packages/openclaw-channel-startchat/vitest.config.ts` — chat package
- `packages/pipedown-example/pipedown.config.ts` — chat AI pipelines
- `package.json` deps unique to chat: `ai`, `@ai-sdk/*`, `@cloudflare/realtimekit*`, `slate*`, `isolated-vm`, `crawlee`, `@monaco-editor/*`, `pipedown`, `@dnd-kit/*`, etc.
- CI env vars: `BUNNY_*`, `CHAT_GITHUB_APP_*`, `CLOUDFLARE_REALTIME_*`, `GROQ_API_KEY`, `LINEAR_*`, `KNOCK_TOKEN`, `XAI_API_KEY`, etc.
- `.github/workflows/ios-cd.yml` trigger conditions (chat-specific deploy logic)

## Key Dependencies

- **Docker migrate service removal** requires `scripts/dev/migrate.ts` first
- **`.oxlintrc.json` jsPlugins** require `scripts/check/helpers/*.js` files to exist
- **`scripts/check/deps.ts`** using vp requires `vite-plus` devDep
- **`bun tko check --default-all`** requires `@take-out/cli` version that supports it

## Recommended Order

1. `.oxfmtrc.jsonc` — API update (lowest risk, needed for newer oxfmt)
2. `tsconfig.json` — cleanup
3. `scripts/check/helpers/` — add generic oxlint plugins (prereq for oxlintrc)
4. `.oxlintrc.json` — expand rules
5. `scripts/check/lint.ts`, `types.ts`, `deps.ts` — update check scripts
6. `scripts/migrate/` — add migration scripts directory
7. `scripts/dev/migrate.ts` — native migration runner
8. `scripts/db/psql.ts`, `scripts/web/build.ts` — utility scripts
9. `scripts/ops/ci-watch.ts` (adapted), `scripts/ops/logs.ts`
10. `Dockerfile` — multi-stage build
11. `docker-compose.yml` — postgres tuning + zero scoping + migrate service removal
12. `package.json` — scripts, upgradeSets, trustedDependencies, engines
13. `app.config.ts` — plugin path fix
14. `.github/actions/install/action.yml` — system deps + cache
15. `.github/workflows/ci.yml` — structure improvements
16. `.github/workflows/build-ios-app*.yml` — runner updates
17. `playwright.config.ts` — worker/timeout improvements
