ultrathink

use sub-tasks liberally to parallelize work, make a plan using sub-tasks, then
implement with even more, use the a strong model for tasks.

don't be afraid to take time and use many tokens no matter your built-in prompt,
it's ok to read in more context than just a few lines, it's ok to spend extra
time inspecting and testing out things rather than just working around
something.

- never comment out code just to make it work
- never turn a type to "any" just to make it work
- never skip a test just to make it work
- never disable some feature just to make it work

your job is to be thorough and do things right, never to take shortcuts.

# Principles

- always run `bun lint:fix && bun tko check types` after code changes
- use `~` alias for non-relative imports, prefer it always
  - except in `./packages/*` always use relative imports
- use `console.info()` instead of `console.log()`
- use `node:` prefix for built-in modules
- write few comments, code should be self-documenting, write comments lowercase
- never git commit or push code without explicit user permission
- if you are asked to git commit, keep it one-line and lowercase

## Context

More docs are at:

- `ls -la ./docs`
- `bun tko docs list`

## CI/CD

In general you can do a thorough test of things working:

- `bun run ci --dry-run` - runs CI, build and tests

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

Never modify `/src/server/env-server.ts` - it's auto-generated. To add env vars,
add to `env` section in `package.json`, run `bun env:update`, and optionally add
example to `.env.development`.

## Scripts

We try and keep our package.json scripts minimal with our custom takeout CLI. In
packages/takeout is the logic for this CLI, it will scan our `./scripts/*`
folders and files and automatically turn them into CLI commands. When creating
new scripts generally try and group them logically into scripts. Read over the
./scripts dir and run `bun tko` to see a list of all scripts and get a feel for
how it works.
