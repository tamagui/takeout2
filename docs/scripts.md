---
name: takeout-scripts
description: Scripts guide for tko CLI automation. scripts, CLI scripts, ./scripts/ directory, tko commands, tko run, parallel execution, script management, bun scripts, npm scripts, automation.
---

# scripts

the takeout cli (`tko`) provides a smart script runner that auto-discovers
scripts from two locations:

1. **local scripts** in `./scripts/` - project-specific scripts
2. **built-in scripts** in `@take-out/scripts` package - shared utilities

local scripts override built-in ones with the same name.

## running scripts

```bash
# run a script directly
bun tko ensure-port 8081
bun tko clean

# run scripts in a category
bun tko web build
bun tko aws health
```

## creating scripts

scripts are `.ts` files in `./scripts/`. add a `@description` comment for
documentation:

```ts
#!/usr/bin/env bun

/**
 * @description Ensure a port is available
 */

const port = process.argv[2]
// ... implementation
```

use `bun tko script new <path>` to scaffold a new script:

```bash
bun tko script new check/ports
# creates ./scripts/check/ports.ts
```

## script organization

```
scripts/
├── build-initial.ts      # top-level scripts
├── node.ts
├── aws/                   # category folders
│   ├── configure.ts
│   └── health.ts
├── check/
│   ├── dependencies.ts
│   └── types.ts
├── ops/
│   ├── release.ts
│   └── run-backend.ts
├── test/
│   ├── e2e.ts
│   ├── unit.ts
│   └── integration.ts
└── web/
    ├── build.ts
    └── serve.ts
```

## helpers directory

scripts can share code via `./scripts/helpers/` (or category-level helpers).
this directory is excluded from script discovery.

```
scripts/
├── helpers/              # shared code, not runnable
│   └── docker.ts
├── ci/
│   └── helpers/          # ci-specific helpers
│       └── deploy.ts
```

## listing available scripts

```bash
# show all available scripts
bun tko

# show scripts in a category
bun tko script aws

# list built-in commands
bun tko --help
```

## built-in commands vs scripts

built-in commands are always available:

- `tko onboard` - setup wizard
- `tko docs` - view documentation
- `tko env:setup` - setup environment
- `tko run` - run scripts in parallel
- `tko script` - manage scripts

everything else routes to the script runner.

## parallel execution

use `tko run` to run multiple scripts in parallel:

```bash
# run three scripts in parallel
bun tko run build lint typecheck

# in package.json
"dev": "tko run run one:dev watch dev-tunnel-if-exist"
```

## script metadata

scripts can define metadata via jsdoc comments:

```ts
/**
 * @description Build docker image for web
 * @args --tag, --push
 */
```

this metadata is cached in `~/.takeout/script-cache.json` for fast lookups.

## ejecting built-in scripts

to customize a built-in script, eject it to your local scripts folder:

```bash
bun tko script eject
```

this copies scripts from `@take-out/scripts` to `./scripts/`, letting you modify
them while keeping the same command interface.
