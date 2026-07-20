# on-zero sync consolidation resume

This branch is based on `origin/main` at `673bde88`, which includes the
registration merge fix. It implements stage 2 of
`/Users/n8/soot/plans/orez-sync-consolidation-2026-07-19.md`. The constraints in
that plan still apply: one cutover, no compatibility shims, no dual execution
paths, no ledger migration, and only light new tests. Zero is pinned to 1.7.0
in the Takeout app and `>=1.7.0` in the on-zero peer boundary.

## Done

- Added the sole server-facing entry `on-zero/orez` with
  `createOrezBindings`. It builds the flat pipe-key mutator registry once,
  maps Orez claims to on-zero auth, reuses generated validators and permission
  helpers, maps `enqueueTask` to Orez deferred effects, resolves synced queries,
  transforms query requests, and exposes a typed direct facade backed by an
  Orez executor.
- Added `packages/on-zero/src/orez.test.ts` against a real SQLite-backed Orez
  executor. It covers auth mapping, registry wire-key stability, validators,
  query resolution, barrier/background effects, and replay idempotency.
- Preserved `packages/on-zero/src/mutations.ts` unchanged, including the merge
  fix from `673bde88`.
- Rebound the live Takeout server in `src/zero/server.ts` to one PostgreSQL Orez
  executor. The push route calls `handleSyncExecutorPushRequest`; the pull route
  uses the binding's query transformer. SSR and anonymous-validation callers
  use the new direct facade.
- Deleted on-zero's semantics layer with no compatibility exports:
  `sqliteRuntime.ts`, `createZeroDirectServer.ts`,
  `createZeroSQLiteServer.ts`, `createZeroServer.ts`,
  `createZeroServerCore.ts`, `syncHost.ts`, `asyncTasks.ts`, `server.ts`, and
  `server.native.ts`, plus their semantics-only tests and HTTP server fixture
  tests. The client HTTP pull transport remains.
- Removed package exports `./server`, `./sqlite`, and `./sync-host`; added only
  `./orez`. Removed the unused PostgreSQL runtime dependency from on-zero.
- Searched on-zero source and built declarations for `PushProcessor`,
  `createZeroServer`, `createZeroSQLiteServer`, `createZeroSyncHostAdapter`,
  `SQLiteLedgerTables`, and `updateClientMutationID`; the removed server
  semantics are absent. on-zero contains no SQL generator, ledger, or conflict
  policy after the cutover.
- Updated package and site documentation for the Orez binding.

## In progress

There is no intentionally half-written source implementation. These files are
coherent but need final validation and lock resolution on the faster machine:

- `packages/on-zero/src/orez.ts` and `orez.test.ts`: typecheck passed and the
  suite was green before the final API cleanup, then the last full suite timed
  out in unrelated codegen tests under extreme machine load. Re-run the package
  suite at normal load.
- `packages/on-zero/package.json`: correctly requires `orez >=0.5.31` and Zero
  `>=1.7.0`, but that Orez version is not published yet.
- Root `package.json`: the live Takeout app is pinned to Zero 1.7.0 and requires
  `orez >=0.5.31`.
- Root `bun.lock` was regenerated with Zero 1.7.0 and a local link to the packed
  unpublished Orez 0.5.31 artifacts. Both manifests still require
  `orez >=0.5.31`. The link entry is the pre-publication validation source and
  must be replaced by the registry resolution after Orez 0.5.31 is published.
- `src/zero/server.ts`, both `app/api/zero/*` routes, the SSR fixtures, and
  `src/test/unit/anon-zero-validation.test.ts`: targeted type and validation
  checks passed with the local Orez build, but the full Takeout repository suite
  was not run.

## Not started

- Stage 3 and every Soot source change are deliberately untouched.
- Ledger migration is deliberately not implemented because the controlling
  plan forbids it and allows owner-test clients to reset.
- No package release or publish was attempted.
- The full Takeout repository suite was not part of the original validation
  bar and has not been run. Only the on-zero package suite, consumer types, and
  affected Takeout validation were targeted.

## Test state

- `bun run typecheck` and `bun run lint` in `packages/on-zero` passed. Logs:
  `/tmp/on-zero-typecheck.log` and `/tmp/on-zero-lint.log`.
- The five prior `src/generate.test.ts` timeouts passed in 2.8 seconds at calm
  load. The full package suite then passed 144 tests plus build and consumer
  types. Logs: `/tmp/on-zero-generate-timeouts-rerun.log` and
  `/tmp/on-zero-suite.log`.
- Anonymous Zero validation passed. Log:
  `/tmp/takeout-anon-zero-validation-final.log`.
- Targeted on-zero lint passed. Log: `/tmp/takeout-onzero-lint-final.log`.
- Local Orez 0.5.31 pack, link registration, lock regeneration, and installation
  passed without publishing. Logs: `/tmp/orez-local-pack-0.5.31.log`,
  `/tmp/takeout-lock-update.log`, and `/tmp/takeout-local-orez-install.log`.

## Precise next steps

1. Read both controlling plan files and the Orez branch resume file before
   changing code.
2. Build or pack the Orez stage-1 branch locally. Make that package available to
   this worktree without publishing, then regenerate `bun.lock` while retaining
   `orez >=0.5.31` and the strict Zero 1.7 boundary.
3. Run, at normal machine load, `bun run typecheck` and
   `bun run test > /tmp/on-zero-suite.log 2>&1` in `packages/on-zero`. The test
   command already includes build and consumer-type validation.
4. Re-run the affected Takeout anonymous validation and targeted lint. Search
   both built output and declarations for the deleted server symbols and for SQL
   or ledger ownership in on-zero.
5. If a test fails by assertion at normal load, fix the demonstrated source
   issue and re-run the complete package command. Do not port deleted semantics
   tests or add compatibility exports.
