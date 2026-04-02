---
name: takeout-package-json
description: Package.json structure guide. package.json, package configuration, scripts section, npm scripts, env vars, environment variables, workspaces, monorepo, trustedDependencies, dependencies.
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

if this repo has a `./packages/scripts` - this is for scripts that are shared
between all users of Takeout, basically any script that is useful beyond being a
demo/example specifically for this repo. but otherwise you want to just put
scripts into `./scripts`.

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
`@take-out/env`. the `envVars` export is the complete registry used by
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
