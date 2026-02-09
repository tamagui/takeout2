---
name: takeout-release
description: Release and publish workflow for Takeout packages. npm publish, version bump, patch release, minor release, major release, canary release, publishing packages, tagging, git tag.
dev: true
---

# Release

all takeout packages are versioned and published together using the release script.

## usage

```bash
bun ./packages/scripts/src/release.ts --patch    # patch bump (0.1.4 -> 0.1.5)
bun ./packages/scripts/src/release.ts --minor    # minor bump (0.1.4 -> 0.2.0)
bun ./packages/scripts/src/release.ts --major    # major bump (0.1.4 -> 1.0.0)
bun ./packages/scripts/src/release.ts --canary   # canary with timestamp
```

## what it does

1. syncs on-zero from github (if ~/github/on-zero exists)
2. ensures on main branch, pulls latest
3. runs `bun install`, `bun clean`, `bun run build`
4. runs `bun lint` and `bun check:all`
5. bumps version in ALL workspace package.json files
6. converts `workspace:*` deps to real versions for publishing
7. packs each package with `bun pm pack`
8. publishes each .tgz with `npm publish`
9. restores `workspace:*` protocols after publishing
10. runs `bun install` to update lockfile
11. commits, tags (v0.1.5), pushes commit + tag
12. syncs on-zero out to github

## important flags

- `--dirty` - skip git clean check (allow uncommitted changes)
- `--dry-run` - do everything except actually publish/commit/push
- `--skip-test` - skip lint and check steps
- `--skip-build` - skip clean and build steps
- `--rerun` / `--republish` - re-publish current version (for failed publishes)
- `--finish` - just do the git commit/tag/push step (if publish succeeded but push failed)
- `--skip-finish` - publish but don't commit/tag/push

## rules

- NEVER manually `npm version` + `npm publish` a single package - all packages release together
- NEVER manually edit version numbers - the release script handles all versioning
- if push fails after publish, use `--finish` to retry the git steps
- the script reads current version from `packages/helpers/package.json`
