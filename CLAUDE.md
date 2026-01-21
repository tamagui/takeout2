USE YOUR SKILLS - we have lots of skills with lots of keywords added to their descriptions! use multiple skills if possible!

even if youre just exploring for info many of our skills with takeout-* are just informational so just use tem

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
- larger changes: `bun run ci --dry-run`

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
