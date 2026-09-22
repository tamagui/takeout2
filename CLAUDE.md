USE YOUR SKILLS - we have lots of skills with lots of keywords added to their descriptions! use multiple skills if possible!

even if you're just exploring for info, many of our skills with takeout-* are just informational, so just use them

## approach

- ultrathink - explore, research, and plan before attempting fixes
- use sub-tasks to parallelize work
- prefer strong models for complex tasks
- aggressively improve context using `bun tko docs list`

## don't cheat

- never comment out code just to make it work
- never turn a type to "any" just to make it work
- never skip a test just to make it work
- never disable some feature just to make it work
- NEVER delete bun.lock - it's critical for reproducible builds

## verification

after completing work:

- small changes: `bun check`
- larger changes: `bun ops release --dry-run`

## testing

two test types - unit (vitest) and integration (playwright):

```bash
bun test:unit                   # unit tests only (fast, no backend needed)
bun lite:demo                   # full stack + seed data, no docker
bun ops release --dry-run       # full CI pipeline (needs docker)
bun ops release --dry-run --dev # faster: uses dev server instead of build
```

integration tests need a backend + frontend on port 8081 and they read the
demo seed data, so start `bun lite:demo` rather than `bun lite`.

**normal loop: leave `bun lite:demo` running**

```bash
# terminal 1: whole stack (postgres, zero, S3, migrations, dev server)
bun lite:demo

# terminal 2: run specific tests as needed
cd src/test
bunx playwright test integration/auth.test.ts      # specific file
bunx playwright test --grep "login"                # by test name
bunx playwright test integration/*.test.ts         # pattern match
```

`bun lite` keeps its data in `.orez/`. delete that directory for a clean
database; there is no `backend:clean` equivalent to run.

set `PORT_OFFSET=<n>` to run a second checkout alongside the first - every
port (web, postgres, zero, S3, orez admin) shifts by it.

**docker is still required for `bun ops release`** (the full CI pipeline, which
uses the same compose services CI does) and for deploy image builds. after
running CI, do `bun backend:clean` before your next `bun backend`, since CI may
have changed auth keys/secrets. that does not affect `bun lite`.

## code style

- run `bun lint:fix && bun tko check types` after code changes
- prefer `~` alias for imports (except in `./packages/*` use relative)
- use `console.info()` not `console.log()`
- use `node:` prefix for built-in modules
- write FEW, LOWERCASE comments - code should be self-documenting
- prefer named exports over `export default` in routes

## environment

env vars are defined in `src/env.ts` using `createEnv` from `@o/env`.
use `expected` for required vars, strings for defaults. use `server.X` for
server-only access (throws on client). run `bun env:update` to sync to CI/docker yml.

## database migrations

```bash
bun db:add-migration <name>  # create new one-off migration file
bun db:build                 # generate SQL + sync wrappers (no run, used by CI)
bun db:migrate               # build + run migrations (locally use this)
```

workflow:

updating schema, just:
1. edit `src/database/schema.ts` (use `pgPrivateTable` for non-Zero tables)
2. run `bun db:migrate` (generates and runs in one step)
3. run `bun zero:generate` if structural change affects the Zero schema

if you need to do something outside schema (rarely!):
1. run `bun db:add-migration <name>`
2. run `bun db:migrate`

rules:
- never write migrations for zero - it manages its own tables automatically
- never write the migration and drizzle schema, we auto-generate that
- always use `db:add-migration` to add a new one-off migration
- rarely use one-off migrations, they are for things like deep custom triggers etc
