# on-zero

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./on-zero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./on-zero.svg">
  <img src="./on-zero.svg" width="120" alt="on-zero">
</picture>

makes [zero](https://zero.rocicorp.dev) really simple to use.

it's what we use for our [takeout stack](https://takeout.tamagui.dev).

## what it does

on-zero tries to bring Rails-like structure and DRY code to Zero + React.

it uses vanilla Zero and `zero-cache` by default. an experimental Orez Lite path
is noted separately at the end of setup.

it provides a few things:

- **generation** - cli with watch and generate commands
- **queries** - convert plain TS query functions into validated synced queries
- **mutations** - simply create CRUD mutations with permissions
- **drizzle-zero** - derive zero schema + relationships from your drizzle schema
- **permissions** - `serverWhere` for simple query-based permissions

plus various hooks and helpers for react integration.

mutations live in `mutations/` with their permissions. queries are just
functions that use a global `zql` builder. schema is derived from drizzle.

## queries

write plain functions. they become synced queries automatically.

```ts
// src/data/queries/notification.ts
import { zql, serverWhere } from 'on-zero'

const permission = serverWhere('notification', (q, auth) => {
  return q.cmp('userId', auth?.id || '')
})

export const latestNotifications = (props: {
  userId: string
  serverId: string
}) => {
  return zql.notification
    .where(permission)
    .where('userId', props.userId)
    .where('serverId', props.serverId)
    .orderBy('createdAt', 'desc')
    .limit(20)
}
```

zql is just the normal Zero query builder based on your typed schema.

use them:

```tsx
const [data, state] = useQuery(latestNotifications, { userId, serverId })
```

the function name becomes the query name. `useQuery` detects plain functions,
creates a cached `SyncedQuery` per function, and calls it with your params.

### query permissions

define permissions inline using `serverWhere()`:

```ts
const permission = serverWhere('channel', (q, auth) => {
  if (auth?.role === 'admin') return true

  return q.and(
    q.cmp('deleted', '!=', true),
    q.or(
      q.cmp('private', false),
      q.exists('role', (r) =>
        r.whereExists('member', (m) => m.where('id', auth?.id)),
      ),
    ),
  )
})
```

then use in queries:

```ts
export const channelById = (props: { channelId: string }) => {
  return zql.channel.where(permission).where('id', props.channelId).one()
}
```

permissions execute server-side only. on the client they automatically pass. the
`serverWhere()` helper automatically accesses auth data via `getAuth()` so you don't need to pass it manually.

## mutations

mutations co-locate permissions and mutation handlers in one file. schema is
derived from drizzle — no need to define it here.

```ts
// src/data/mutations/message.ts
import { ensureLoggedIn, mutations, serverWhere } from 'on-zero'

const permissions = serverWhere('message', (q, auth) => {
  return q.cmp('authorId', auth?.id || '')
})

// pass table name as string — types are inferred from schema
export const mutate = mutations('message', permissions, {
  async send(
    ctx,
    props: { id: string; content: string; channelId: string; createdAt: number },
  ) {
    const auth = ensureLoggedIn()

    await ctx.tx.mutate.message.insert({
      id: props.id,
      content: props.content,
      channelId: props.channelId,
      authorId: auth.id,
      createdAt: props.createdAt,
    })
    await ctx.can(permissions, props.id)

    if (ctx.server) {
      ctx.server.enqueueTask(async () => {
        await ctx.server.actions.sendNotification(props)
      })
    }
  },
})
```

call mutations from react:

```tsx
await zero.mutate.message.send({
  id: randomId(),
  content: 'hello',
  channelId: 'ch-1',
  createdAt: Date.now(),
})
```

the second argument (`permissions`) enables auto-generated crud that checks
permissions:

```tsx
zero.mutate.message.insert(message)
zero.mutate.message.update(message)
zero.mutate.message.delete(message)
zero.mutate.message.upsert(message)
```

if you define `insert`, `upsert`, `update`, or `delete` in the third argument,
that handler replaces the generated operation completely. on-zero does not add
an automatic permission check or write. validate however the handler needs to;
`ctx.can()` is available for query-based permissions, but any thrown error
rejects and rolls back the transaction. when using `ctx.can()`, check before an
update or delete. for an insert, write first and then check so the permission
query can see the new row. a custom handler can no-op with a normal `return`.

## permissions

on-zero's permissions system is optional - you can implement your own
permission logic however you like. `serverWhere()` is a light helper for
RLS-style permissions that automatically integrate with queries and mutations.

permissions use the `serverWhere()` helper to create Zero `ExpressionBuilder`
conditions:

```ts
export const permissions = serverWhere('channel', (q, auth) => {
  if (auth?.role === 'admin') return true

  return q.or(
    q.cmp('public', true),
    q.exists('members', (m) => m.where('userId', auth?.id)),
  )
})
```

the `serverWhere()` helper automatically gets auth data via `getAuth()`, so you don't manually pass it. permissions only execute
server-side - on the client they automatically pass.

**for queries:** define permissions inline as a constant in query files:

```ts
// src/data/queries/channel.ts
const permission = serverWhere('channel', (q, auth) => {
  return q.cmp('userId', auth?.id || '')
})

export const myChannels = () => {
  return zql.channel.where(permission)
}
```

**for mutations:** define permissions in mutation files for CRUD operations:

```ts
// src/data/mutations/message.ts
const permissions = serverWhere('message', (q, auth) => {
  return q.cmp('authorId', auth?.id || '')
})
```

built-in CRUD mutations automatically apply them. custom mutations, including
CRUD overrides, own their validation. they can use `can()` for query-based
permissions or throw from any other validation:

```ts
await ctx.can(permissions, messageId)
```

check permissions in React with `usePermission()`:

```tsx
const canEdit = usePermission('message', messageId)
```

### composable query partials

for complex or reusable query logic, create partials in a `where/` directory.
use `serverWhere` without a table name to create partials that work across
multiple tables:

```ts
// src/data/where/server.ts
import { serverWhere } from 'on-zero'

type RelatedToServer = 'role' | 'channel' | 'message'

export const hasServerAdminPermission = serverWhere<RelatedToServer>((_, auth) =>
  _.exists('server', (q) =>
    q.whereExists('role', (r) =>
      r.where('canAdmin', true)
       .whereExists('member', (m) => m.where('id', auth?.id || ''))
    )
  )
)

export const hasServerReadPermission = serverWhere<RelatedToServer>((_, auth) =>
  _.exists('server', (q) =>
    q.where((_) =>
      _.or(
        _.cmp('private', false),
        _.exists('member', (m) => m.where('id', auth?.id || ''))
      )
    )
  )
)
```

then compose them in other permissions:

```ts
// src/data/where/channel.ts
import { serverWhere } from 'on-zero'
import { hasServerAdminPermission, hasServerReadPermission } from './server'

type RelatedToChannel = 'message' | 'pin' | 'channelTopic'

const hasChannelRole = serverWhere<RelatedToChannel>((_, auth) =>
  _.exists('channel', (q) =>
    q.whereExists('role', (r) =>
      r.whereExists('member', (m) => m.where('id', auth?.id || ''))
    )
  )
)

export const hasChannelReadPermission = serverWhere<RelatedToChannel>((_, auth) => {
  const isServerMember = hasServerReadPermission(_, auth)
  const isChannelMember = hasChannelRole(_, auth)
  const isAdmin = hasServerAdminPermission(_, auth)

  return _.or(isServerMember, isChannelMember, isAdmin)
})
```

use in queries:

```ts
import { hasChannelReadPermission } from '../where/channel'

export const channelMessages = (props: { channelId: string }) => {
  return zql.message
    .where(hasChannelReadPermission)
    .where('channelId', props.channelId)
}
```

## generation

on-zero auto-generates glue files that wire up your mutations, queries, and types.

### vite plugin (recommended)

the vite plugin handles generation and HMR automatically:

```ts
// vite.config.ts
import { onZeroPlugin } from 'on-zero/vite'

export default {
  plugins: [
    onZeroPlugin(),
    // ... other plugins
  ]
}
```

**features:**

- generates on dev server start
- watches for mutation/query changes and regenerates
- enables HMR for mutations (no page reload when editing mutation files)
- generates before production builds

**options:**

```ts
onZeroPlugin({
  // path to data directory (default: 'src/data')
  dataDir: 'src/data',

  // additional paths to apply HMR fix to
  hmrInclude: ['/src/zero/'],

  // disable generation (HMR only)
  disableGenerate: false,
})
```

### cli (alternative)

if you prefer CLI over the vite plugin:

**`on-zero generate [dir]`**

generates all files needed to connect your mutations and queries:

- `schema.ts` - zero schema derived from drizzle via drizzle-zero (tables +
  relationships)
- `models.ts` - aggregates all mutation files into a single import
- `types.ts` - typescript types derived from the schema
- `syncedQueries.ts` - generates synced query definitions with valibot
  validators
- `syncedMutations.ts` - generates valibot validators for mutation args
  (auto-validation on server)

**options:**

- `dir` - base directory containing `mutations/` and `queries/` folders
  (default: `src/data`)
- `--watch` - watch for changes and regenerate automatically
- `--after` - command to run after generation completes
- `--force` - ignore cached inputs and regenerate all outputs

**examples:**

```bash
# generate once
bun on-zero generate

# generate and watch
bun on-zero generate --watch

# custom directory
bun on-zero generate ./app/data

# run linter after generation
bun on-zero generate --after "bun lint:fix"

# regenerate after upgrading schema or type dependencies
bun on-zero generate --force
```

**types.ts:**

```ts
import type { Row } from '@rocicorp/zero'
import type { schema } from './schema'

type Tables = typeof schema.tables

export type Channel = Row<Tables['channel']>
export type ChannelUpdate = Partial<Channel> & Pick<Channel, 'id'>
```

**syncedQueries.ts:**

```ts
import * as v from 'valibot'
import { syncedQuery } from '@rocicorp/zero'
import * as messageQueries from '../queries/message'

export const latestMessages = syncedQuery(
  'latestMessages',
  v.parser(
    v.tuple([
      v.object({
        channelId: v.string(),
        limit: v.optional(v.number()),
      }),
    ]),
  ),
  (arg) => {
    return messageQueries.latestMessages(arg)
  },
)
```

### how it works

the generator:

1. scans `mutations/` for files with `export const mutate`
2. scans `queries/` for exported arrow functions
3. parses TypeScript AST to extract parameter types
4. converts types to valibot schemas
5. wraps query functions in `syncedQuery()` with validators
6. extracts mutation handler param types using the TS type checker (resolves
   imports, aliases, and cross-file references)
7. generates `syncedMutations.ts` with valibot validators for mutation args

when using drizzle-zero integration, `schema.ts` is generated from your drizzle
schema using `generateDrizzleSchemaFile()` — it produces `table()` + 
`relationships()` + `createSchema()` calls with full type inference.

exports named `permission` are automatically skipped during query generation.

### drizzle-zero integration

on-zero can derive your zero schema (tables + relationships) from a drizzle
schema via [drizzle-zero](https://github.com/rocicorp/drizzle-zero). this
eliminates duplicate column definitions — drizzle is the single source of truth.

```ts
// generate-schema.ts (run at build/dev time)
import { drizzleZeroConfig } from 'drizzle-zero'
import { generateDrizzleSchemaFile } from 'on-zero'
import * as drizzleSchema from './database/schema'
import { relations } from './database/relations'

const dzSchema = drizzleZeroConfig(
  { ...drizzleSchema, relations },
  {
    tables: {
      user: true,
      post: true,
      comment: true,
    },
    suppressDefaultsWarning: true,
  },
)

// generates a typed schema.ts with createSchema() + relationships()
const output = generateDrizzleSchemaFile(dzSchema)
writeFileSync('src/data/generated/schema.ts', output)
```

the generated file uses zero's `table()` builder and `relationships()` function,
giving full type inference for zql queries including nested `.related()` calls.

mutations then reference tables by name:

```ts
export const mutate = mutations('post', permissions, { ... })
```

the `mutations()` string overload derives insert/update/delete types from the
global schema type — no need to import table builders.

## setup

the supported setup uses vanilla Zero and `zero-cache`:

```tsx
import { createZeroClient } from 'on-zero'
import { schema } from '~/data/generated/schema'
import { models } from '~/data/generated/models'
import * as groupedQueries from '~/data/generated/groupedQueries'

export const { ProvideZero, useQuery, zero, usePermission } = createZeroClient({
  schema,
  models,
  groupedQueries,
})
```

### vanilla Zero

vanilla Zero uses the standard `zero-cache` server and its built-in WebSocket
transport. mount the shared client without a `transport` prop:

```tsx
// in your app root
<ProvideZero
  cacheURL="http://localhost:4848"
  userID={user.id}
  auth={sessionToken}
  authData={{ id: user.id, email: user.email, role: user.role }}
>
  <App />
</ProvideZero>
```

configure `zero-cache`, `ZERO_QUERY_URL`, and `ZERO_MUTATE_URL` using the
standard [Zero installation guide](https://zero.rocicorp.dev/docs/install).

### multiple client instances

one page can run several zero clients (e.g. a global control-plane instance
plus a per-project instance with its own storage key and sync url). give each
a unique `instanceName` and split queries/models so every namespace belongs to
exactly one instance — duplicate claims throw at create time. then combine
them into one consumer surface:

```tsx
import { createZeroClient } from 'on-zero'
import { combineZeroClients, createZeroClientWithDirectQueries } from 'on-zero/multi'

const control = createZeroClientWithDirectQueries({
  schema,
  models: controlModels,
  groupedQueries: controlQueries,
  instanceName: 'control',
})
const project = createZeroClient({
  schema,
  models: projectModels,
  groupedQueries: projectQueries,
  instanceName: 'project',
})

// useQuery/run/preload/getQuery dispatch by the query fn's namespace,
// zero.mutate.<namespace> dispatches by model namespace; anything unclaimed
// (and non-mutate zero access like userID) goes to the first client
export const { useQuery, zero, run, preload, getQuery, zeroEvents } =
  combineZeroClients(control, project)

// render every instance's provider. NESTING ORDER IS A CONTRACT: the LAST
// client passed to combineZeroClients (or the `inner` option) must be the
// INNERMOST provider — zero-react's useQuery resolves the nearest provider's
// instance from context, so only the inner instance rides that path. all
// other instances must opt into the context-free direct adapter through
// createZeroClientWithDirectQueries.
;<control.ProvideZero cacheURL={controlUrl} userID={user.id}>
  <project.ProvideZero cacheURL={projectUrl} userID={`${user.id}:${projectId}`}>
    <App />
  </project.ProvideZero>
</control.ProvideZero>
```

constraints:

- each instance needs its own client-group identity (separate `userID` /
  storage key / cache url) — never swap the backing namespace under a live
  instance.
- most apps should use plain `createZeroClient`; the `on-zero/multi` entrypoint
  is only for this nested-provider edge case.
- give the INNER slot to the instance owning the bulk of the subscriptions —
  inner queries use zero-react's native context path. outer instances use the
  direct adapter on their own mounted zero, so keep those instances on bounded,
  low-fanout queries (current user, settings, directories).
- a mutator may only read/write tables owned by its own instance. its
  transaction runs on that instance alone; cross-instance writes are not
  detectable at registration and will silently miss the other store.
- omitting `instanceName` keeps the exact single-instance behavior.

**guarding the partition against drift.** a generated namespace that ends up in
NEITHER instance's split silently un-registers its queries (a `useQuery` then
throws "query not registered" at runtime, error-boundarying a whole screen). run
`assertZeroInstancePartition` at module eval over each split so the drift is a
boot throw instead — it also catches a namespace listed in more than one
partition:

```ts
import { assertZeroInstancePartition } from 'on-zero/multi'

assertZeroInstancePartition('query namespace', groupedQueries, {
  control: controlQueries,
  project: projectQueries,
})
assertZeroInstancePartition('model namespace', models, {
  control: controlModels,
  project: projectModels,
})
```

### server validation hooks

add custom validation for all queries and mutations:

```ts
export const zeroBindings = createZeroServerBindings({
  schema,
  models,
  queries: syncedQueries,
  createServerActions: () => ({ ... }),

  // validate all queries before execution (must be sync, throw to reject)
  validateQuery({ authData, queryName, params }) {
    if (queryName === 'adminOnlyQuery' && authData?.role !== 'admin') {
      throw new Error('admin only')
    }
  },

  // validate all mutations before execution (can be async)
  async validateMutation({ authData, tableName, mutatorName, args }) {
    if (tableName === 'user' && mutatorName === 'delete') {
      await auditLog('user.delete', authData, args)
    }
  },

  // admin role bypass for permissions (default: 'all')
  // - 'all': admin bypasses both query and mutation permissions
  // - 'queries': admin bypasses only query permissions
  // - 'mutations': admin bypasses only mutation permissions
  // - 'off': no admin bypass, normal permission checks apply
  defaultAllowAdminRole: 'all',

})
```

### mutation arg validation

on-zero can auto-generate valibot validators for all mutation arguments. the
generator uses the TypeScript type checker to deeply resolve param types -
including imported types, aliases, and cross-file references - then converts them
to valibot schemas.

pass the generated `mutationValidators` to `createZeroServerBindings`:

```ts
import { mutationValidators } from '~/data/generated/syncedMutations'

export const zeroBindings = createZeroServerBindings({
  // ...
  mutations: mutationValidators,
})
```

this auto-validates args before every mutation runs. for a model like:

```ts
export const mutate = mutations('message', permissions, {
  async send(ctx, props: { content: string; channelId: string }) {
    // ...
  },
})
```

the generator produces validators for both the CRUD operations (derived from the
schema columns) and custom mutations (derived from handler param types). if
validation fails, the mutation throws before executing.

the generated `syncedMutations.ts` looks like:

```ts
import * as v from 'valibot'

export const mutationValidators = {
  message: {
    insert: v.object({ id: v.string(), content: v.string(), ... }),
    update: v.object({ id: v.string(), content: v.optional(v.string()), ... }),
    delete: v.object({ id: v.string() }),
    send: v.object({ content: v.string(), channelId: v.string() }),
  },
}
```

validation runs before the `validateMutation` hook, so both layers stack:
valibot validates shape/types, then your custom hook can add business logic.

type augmentation:

```ts
// src/zero/types.ts
import type { schema } from '~/data/schema'
import type { AuthData } from './auth'

declare module 'on-zero' {
  interface Config {
    schema: typeof schema
    authData: AuthData
  }
}
```

### Orez Lite (experimental)

Orez Lite is our custom Rust engine and a separate alternative to vanilla Zero.
it is still pre-alpha, so its setup is intentionally not documented here yet.

## mutation context

every mutation receives `MutatorContext` as first argument:

```ts
type MutatorContext = {
  tx: Transaction // database transaction
  authData: AuthData | null // current user
  environment: 'server' | 'client' // where executing
  can: (where, obj) => Promise<void> // permission checker
  server?: {
    actions: ServerActions // async server functions
    enqueueTask(task: AsyncTask, opts?: { barrier?: boolean }): void
  }
}
```

use it:

```ts
export const mutate = mutations('message', permissions, {
  async archive(ctx, { messageId }) {
    await ctx.can(permissions, messageId)
    await ctx.tx.mutate.message.update({ id: messageId, archived: true })

    ctx.server?.enqueueTask(async () => {
      await ctx.server.actions.indexForSearch(messageId)

      // zeroServer.mutate works here too - authData is auto-inherited
      await zeroServer.mutate.activity.insert({
        id: randomId(),
        type: 'archive',
        messageId,
      })
    })
  },
})
```

`enqueueTask()` runs after the transaction commits and does not block the push
response by default. Pass `{ barrier: true }` only when the client's next writes
depend on the effect, such as provisioning a namespace before the client writes
through a new Zero instance.

## getAuth

`getAuth()` returns the current user's auth data. works inside both queries and
mutations:

```ts
import { getAuth } from 'on-zero'

const auth = getAuth() // AuthData | null
```

it resolves auth from whichever context is active — mutation context, query
context, or client-side global. most of the time you won't need this directly
since `serverWhere()` passes auth to your callback automatically. use `getAuth()`
when you need auth data outside of those callbacks, like in a shared utility.

### ensureAuth

`ensureAuth()` is the same as `getAuth()` but throws if the user is not
authenticated instead of returning null:

```ts
import { ensureAuth } from 'on-zero'

const auth = ensureAuth() // AuthData (throws if not authenticated)
```

## recovery

on-zero self-heals a client whose local sync state is lost or rejected. this is
**on by default** — a consumer that passes nothing gets the full behavior. the
hooks below let you compose ONE extra behavior (gate the reload, reload
natively, drop a benign log, refresh auth) without re-implementing the stack.

### what's on by default

`ProvideZero` installs Zero's `onUpdateNeeded` / `onClientStateNotFound` and a
log sink that watches for the fatal store-loss / desync signatures. on a match it
drops the affected instance's local store and reloads the page ONCE. this covers:

- **update-needed** — `SchemaVersionNotSupported` (drops local state, the rows
  are now incompatible), `NewClientGroup` / `VersionNotSupported` (reload
  without dropping, so a sibling tab's shared IndexedDB survives).
- **client-state-not-found** — the store is unusable; drop it and reload.
- **log-only fatals** — `Expected IndexedDB not found`, native sqlite
  `This statement has been finalized`, and repeated `Store is closed`.
- **the mutation/connection desync class** — `sent mutation ID … but expected`,
  `oooMutation`, `already processed`, `InvalidConnectionRequestBaseCookie` /
  `…LastMutationID`, `ClientNotFound`, `connection userID mismatch`. these
  surface only through the error log, so the log sink recovers on them too.

genuinely app-infra signatures (your own synthesized ack-timeout marker, a
cold-boot connect timeout) are NOT in this list — keep those app-side and use
`benignLogFilter` to stop them from tripping recovery.

### the hooks (all optional props on `ProvideZero`)

- **`scheduleReload?: (ctx) => void`** — take over WHEN/HOW the recovery reload
  happens. `ctx = { reason, reasonKey, dropLocalState, performReload }`. the
  default is an immediate reload; inject this to gate it (only reload when the
  user is on a safe surface), show a countdown toast, or reload natively —
  then call `ctx.performReload()` to run the real deletes-then-reload work. the
  store delete is deferred until `performReload` runs, so a gated reload never
  leaves the app on an already-deleted store. `performReload` is idempotent.

  ```tsx
  // native (expo): reload the bundle instead of location.reload()
  <ProvideZero
    scheduleReload={(ctx) => {
      void ctx
        .performReload()
        .then(() => Updates.reloadAsync())
        .catch(() => DevSettings.reload())
    }}
    …
  />
  ```

- **`beforeReload?: () => Promise<void>`** — awaited right before the reload
  (e.g. wait for the dev origin to come back so the reload doesn't hit a
  restarting server). composes with `scheduleReload`.

- **`benignLogFilter?: (message) => boolean`** — return `true` for a classified
  recovery log you want treated as benign so it does NOT recover (your app's
  cold-boot timeout, say). only affects recovery; the log still reaches the sink.

- **`refreshAuth?: () => Promise<string | undefined>`** — called when the
  connection enters `needs-auth` (an expired token). return a fresh token and
  on-zero reconnects in place — no reload. fires once per needs-auth transition.

- **`guardStorage?: { getItem, setItem }`** — the loop-guard's cross-reload
  backing store. defaults to `sessionStorage` on web; inject a native KV
  (MMKV/sqlite) on Hermes so native gets real cross-reload loop protection.

- **`connectionDataset?: boolean`** — mirror this instance's connection state
  onto `document.body.dataset.zero*` (`zeroState`, `zeroConnected`,
  `zeroReason`, `zeroCacheUrl`) for e2e/diagnostics. enable on ONE instance so
  multiple instances don't clobber the dataset.

### guard + latch semantics

- a **per-reason guard** (60s window) means the SAME reason re-failing right
  after its reload is surfaced as `fatal` instead of reload-storming; distinct
  reasons never suppress each other. it's two-tier: an in-memory map (real loop
  protection within a page-load, works on Hermes) plus the cross-reload
  `guardStorage` (survives the reload to catch an immediate re-fire).
- a **one-reload latch** means every affected instance of a combined client
  drops its own store but only ONE reload fires. the latch **times out** (15s)
  so a reload that never lands (a gated/native reload, a failed `reload()`)
  can't kill recovery for the rest of the page's life.

### remint — in-place recovery without a reload

`createZeroClient` returns **`remint(opts?)`** — the supported, native-safe
recovery path (a reload may never land on prod native, wedging the latch).
it drops the current instance's local store (unless `dropLocalState: false`) and
reconstructs a fresh Zero client in place, no page reload. it is rate-guarded
in-memory (12s between mints, 5 attempts before backing off, reset after 60s
stable) and returns `false` when suppressed. route your own
`onClientStateNotFound` to it if you need in-place recovery:

```tsx
const { remint, ProvideZero } = createZeroClient({ … })
<ProvideZero onClientStateNotFound={() => { void remint() }} … />
```

### stale-poke resume (automatic)

a recoverable stale-cookie / stale-poke error (`Server returned unexpected base
cookie during sync`; `Received cookie … is < than last snapshot cookie … ignoring
client view`) is generic Zero behavior — on-zero's connection monitor reconnects
instead of surfacing a fatal error, deduped per reason. no configuration.

## patterns

**server-only mutations:**

```ts
await zeroServer.mutate.user.insert(user)

// with explicit auth (optional - authData auto-resolves from context)
await zeroServer.mutate.user.insert(user, { authData: { id: userId, email } })

```

the second argument is an options object:

- `authData` — override auth for this call (optional, auto-resolves from context)

authData is automatically resolved in this order:

1. explicit `authData` in options (if passed)
2. current mutation context (inside a mutation)
3. auth scope (inside async tasks - automatically inherited)

**one-off queries with `run()`:**

run a query once without subscribing. works on both client and server:

```ts
import { run } from 'on-zero'
import { userById } from '~/data/queries/user'

// with params - defaults to cache only on client
const user = await run(userById, { id: userId })

// fetch from server (waits for sync)
const user = await run(userById, { id: userId }, 'complete')

// without params
const allUsers = await run(allUsers)

// without params, fetch from server
const allUsers = await run(allUsers, 'complete')
```

on-zero run is smart:

- on client, uses client `zero.run()`
- on server, uses server `zero.run()`
- in a mutation, uses `tx.run()`

**getQuery — resolve a query object directly:**

use `getQuery` when you need the raw zero query object rather than subscribing via `useQuery`. useful for passing to third-party hooks that accept zero query objects directly (e.g. virtualized list hooks):

```ts
import { getQuery } from '~/zero/client'
import { postById } from '~/data/queries/post'

// returns the zero query object — same as what useQuery resolves internally
const query = getQuery(postById, { postId: '123' })

// pass to any hook that accepts a zero query directly
const [rows] = useRows(getQuery(feedPosts, { limit: 50 }))
```

same signature as `useQuery` — `getQuery(fn, params?)`.

**preloading data (client only):**

preload query results into cache without subscribing:

```ts
import { preload } from '~/zero/client'
import { userNotifications } from '~/data/queries/notification'

// preload after login
const { complete, cleanup } = preload(userNotifications, { userId, limit: 100 })
await complete

// cleanup if needed
cleanup()
```

useful for prefetching data before navigation to avoid loading states.

**server-only queries:**

for ad-hoc queries that don't use query functions:

```ts
const user = await zeroServer.query(
  { userID: userId },
  (q) => q.user.where('id', userId).one(),
)
```

**controlling queries with `ControlQueries`:**

disable all `useQuery` and `usePermission` calls within a subtree. useful for
hiding screens, background tabs, or any UI where you want to pause syncing:

```tsx
import { ControlQueries } from '~/zero/client'

// disable queries, returns null for all useQuery/usePermission calls
<ControlQueries action="disable">
  <ExpensiveScreen />
</ControlQueries>

// disable but keep returning the last value (no flash to empty)
<ControlQueries action="disable" whenDisabled="last-value">
  <ExpensiveScreen />
</ControlQueries>

// re-enable inside a disabled subtree
<ControlQueries action="disable" whenDisabled="last-value">
  <ControlQueries action="enable">
    <AlwaysLiveWidget />
  </ControlQueries>
</ControlQueries>
```

props:

- `action` — `'enable' | 'disable'` (default `'disable'`)
- `whenDisabled` — `'empty' | 'last-value'` (default `'empty'`)
  - `'empty'` — queries return `[null, { type: 'unknown' }]`
  - `'last-value'` — queries return their most recent result

**batch processing:**

```ts
import { batchQuery } from 'on-zero'

await batchQuery(
  zql.message.where('processed', false),
  async (messages) => {
    for (const msg of messages) {
      await processMessage(msg)
    }
  },
  { chunk: 100, pause: 50 },
)
```
