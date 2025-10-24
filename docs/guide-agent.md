# Principles

- always run `bun lint:fix && bun types:check:fast` after code changes
- use `~` alias for non-relative imports, prefer it always
- use `console.info()` instead of `console.log()`
- use `node:` prefix for built-in modules
- write few comments, code should be self-documenting, write comments lowercase
- never git commit or push code without explicit user permission

## More docs

Please run a `ls -la ./docs` with a background task to get a list of guides
available and be very eager to read them into context they are highly optimized
and relevant context.

For any UI: `./docs/guide-tamagui.md` For Zero/queries: `./docs/guide-zero.md`,
`./docs/guide-zero-mutations.md`

There are many more.

## Database

For changes that can happen at Drizzle schema level, just update schema-public
or schema-private. For any other migration, you need to run
`bun db:migrate:add migration-name`. We don't do down migrations. Don't auto
migrate, but if you do use `bun migrate` not `db:push`.

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
