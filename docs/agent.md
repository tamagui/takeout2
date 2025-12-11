# Process

ultrathink

generally explore, research, and plan before attempting a fix, liberally use
your context, liberally use sub-tasks to parallelize work, and prefer a strong
model for tasks.

don't cheat:

- never comment out code just to make it work
- never turn a type to "any" just to make it work
- never skip a test just to make it work
- never disable some feature just to make it work

your job is to be thorough and do things right.

the most thorough way to test everything is working:

- `bun run ci --dry-run` - runs robust builds, checks, tests

it's recommended to run this after completing a larger portion of work.

for smaller amounts of work you can just use `bun check:all`.

# Principles

- ALWAYS run `bun lint:fix && bun tko check types` at least after code changes
- ALWAYS prefer `~` alias for non-relative imports
  - except in `./packages/*` they need relative imports
- use `console.info()` instead of `console.log()`
- use `node:` prefix for built-in modules
- write FEW, LOWERCASE comments, code should be mostly self-documenting
- NEVER git commit or push code without explicit user permission
  - don't add this as the final step in your todo list, again unless asked
  - ONLY IF you are asked to git commit, keep it one-line and lowercase, don't
    add yourself as a contributor

## Context

aggressively improve your context before doing tasks, you can list the internal
framework docs as well as repo-level docs (in ./docs) using `bun tko docs list`.

### State Management

in general zero + useState are great, for ephemeral global state use emitters
from `@take-out/helpers`.

## CI/CD

## App

- prefer not to `export default` in any route, One takes the first "export" as
  the page which also hot reloads properly as opposed to export default

## Database

For changes that can happen at Drizzle schema level, just update schema-public
or schema-private. For any other migration, you need to run
`bun db:migrate:add migration-name`. We don't do down migrations. Don't auto
migrate, but if you do use `bun migrate` not `bun tko db push`.

## Zero

All mutations receive MutatorContext as the first argument. Whatever client
inserts should also be inserted the same by server ideally, otherwise it will
rebase.

Avoid randomness inside custom mutators, instead client passes in anything
needed like randomId() for id, or Date.now() for dates. If you create another
model inside a mutator, you can usually do the pattern of using the parent
related item id, eg doing: `${messageId}-task` for a task you insert based off a
message.

Don't do anything long-running in a mutation, as it leaves the database
transaction open, instead on server you usually add a serverAction and then push
it into asyncTasks to run after the mutation - these are both available on
MutatorContext.

## Environment

NEVER modify `/src/server/env-server.ts` - it's auto-generated. To add env vars,
add to `env` section in `package.json`, run `bun env:update`, and optionally add
example to `.env.development`.

## Scripts

We try and keep our package.json scripts minimal with our custom takeout CLI. In
packages/takeout is the logic for this CLI, it will scan our `./scripts/*`
folders and files and automatically turn them into CLI commands. When creating
new scripts generally try and group them logically into scripts. Read over the
./scripts dir and run `bun tko` to see a list of all scripts and get a feel for
how it works.

## Testing / Release

in general run a `bun run ci release --dry-run` to test that everything still
works and CI passes, it should work so long as .env.production exists and is
filled out
