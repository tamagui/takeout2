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

## verification

after completing work:

- small changes: `bun check:all`
- larger changes: `bun run ci release --dry-run`

## testing

two test types - unit (vitest) and integration (playwright):

```bash
bun test:unit                      # unit tests only (fast, no backend needed)
bun run ci release --dry-run       # full test suite with backend setup
bun run ci release --dry-run --dev # faster: uses dev server instead of build
```

integration tests require the full backend (docker) + frontend on port 8081.
the CI command handles all setup automatically - it's the easiest way to run everything.

to run integration tests manually:
1. `bun backend` (wait for migrations)
2. `bun dev` or `bun web serve` (port 8081)
3. `cd src/test && bunx playwright test`

## code style

- run `bun lint:fix && bun tko check types` after code changes
- prefer `~` alias for imports (except in `./packages/*` use relative)
- use `console.info()` not `console.log()`
- use `node:` prefix for built-in modules
- write FEW, LOWERCASE comments - code should be self-documenting
- prefer named exports over `export default` in routes

## environment

never modify `/src/server/env-server.ts` - it's auto-generated. to add env vars:

1. add to `env` section in `package.json`
2. run `bun env:update`
3. optionally add example to `.env.development`

## database migrations

```bash
bun db:add-migration <name>  # create new migration file
bun db:migrate               # build + run migrations
```

workflow:
1. edit schema in `src/database/schema*.ts`
2. run `bun db:add-migration <name>`
3. run `bun db:migrate`

rules:
- never write migrations for zero - it manages its own tables automatically
- never write raw SQL migrations - drizzle generates them from schema changes
- never create migration files manually - always use `db:add-migration` for consistent naming
