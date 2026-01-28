# over-zero

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./over-zero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./over-zero.svg">
  <img src="./over-zero.svg" width="120" alt="over-zero">
</picture>

makes [zero](https://zero.rocicorp.dev) really simple to use

## what it does

over-zero provides three integrated systems on top of zero:

- **queries** - plain functions that become synced queries
- **mutations** - server-validated operations with auto-generated crud
- **permissions** - composable access control checked at runtime

the package handles schema setup, type generation, and react integration. models
live alongside their permissions and mutations. queries are just functions that
use a global `zql` builder.

## queries

write plain functions. they become synced queries automatically.

```ts
// src/data/queries/notification.ts
import { zql, where } from 'over-zero'

const permission = where('notification', (q, auth) => {
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

define permissions inline using `where()`:

```ts
const permission = where('channel', (q, auth) => {
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
`where()` helper automatically accesses auth data from `queryContext()` or
`mutatorContext()` so you don't need to pass it manually.

## mutations

define schema, permissions, and mutations together:

```ts
// src/data/models/message.ts
import { table, mutations, where } from 'over-zero'

export const schema = table('message')
  .columns({
    id: string(),
    content: string(),
    authorId: string(),
    channelId: string(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('message', (q, auth) => {
  return q.cmp('authorId', auth?.id || '')
})

// CRUD mutations with permissions by passing schema + permissions:
export const mutate = mutations(schema, permissions, {
  async send(ctx, props: { content: string; channelId: string }) {
    await ctx.can(permissions, props)

    await ctx.tx.mutate.message.insert({
      id: randomId(),
      content: props.content,
      channelId: props.channelId,
      authorId: ctx.authData!.id,
      createdAt: Date.now(),
    })

    if (ctx.server) {
      ctx.server.asyncTasks.push(async () => {
        await ctx.server.actions.sendNotification(props)
      })
    }
  },
})
```

call mutations from react:

```tsx
await zero.mutate.message.send({ content: 'hello', channelId: 'ch-1' })
```

the second argument (`permissions`) enables auto-generated crud that checks
permissions:

```tsx
zero.mutate.message.insert(message)
zero.mutate.message.update(message)
zero.mutate.message.delete(message)
zero.mutate.message.upsert(message)
```

## permissions

permissions use the `where()` helper to create Zero `ExpressionBuilder`
conditions:

```ts
export const permissions = where('channel', (q, auth) => {
  if (auth?.role === 'admin') return true

  return q.or(
    q.cmp('public', true),
    q.exists('members', (m) => m.where('userId', auth?.id)),
  )
})
```

the `where()` helper automatically gets auth data from `queryContext()` or
`mutatorContext()`, so you don't manually pass it. permissions only execute
server-side - on the client they automatically pass.

**for queries:** define permissions inline as a constant in query files:

```ts
// src/data/queries/channel.ts
const permission = where('channel', (q, auth) => {
  return q.cmp('userId', auth?.id || '')
})

export const myChannels = () => {
  return zql.channel.where(permission)
}
```

**for mutations:** define permissions in model files for CRUD operations:

```ts
// src/data/models/message.ts
export const permissions = where('message', (q, auth) => {
  return q.cmp('authorId', auth?.id || '')
})
```

CRUD mutations automatically apply them, but for custom mutations use `can()`:

```ts
await ctx.can(permissions, messageId)
```

check permissions in React with `usePermission()`:

```tsx
const canEdit = usePermission('message', messageId)
```

## generation

`over-zero` has a CLI that auto-generates glue files that wire up your models,
queries, and types.

### cli commands

**`over-zero generate [dir]`**

generates all files needed to connect your models and queries:

- `models.ts` - aggregates all model files into a single import
- `types.ts` - generates TypeScript types from table schemas
- `tables.ts` - exports table schemas (separate to avoid circular types)
- `syncedQueries.ts` - generates synced query definitions with valibot validators

**options:**

- `dir` - base directory containing `models/` and `queries/` folders (default:
  `src/data`)
- `--watch` - watch for changes and regenerate automatically
- `--after` - command to run after generation completes

**examples:**

```bash
# generate once
bun over-zero generate

# generate and watch
bun over-zero generate --watch

# custom directory
bun over-zero generate ./app/data

# run linter after generation
bun over-zero generate --after "bun lint:fix"
```

**`over-zero generate-queries <dir>`**

generates query validators from TypeScript query functions. this is included in
`generate` but can be run standalone.

- parses exported arrow functions from `.ts` files in the queries directory
- extracts parameter types using TypeScript compiler API
- generates valibot schemas using typebox-codegen

**example:**

```bash
bun over-zero generate-queries src/data/queries
```

### what gets generated

**models.ts:**

```ts
import * as channel from '~/data/models/channel'
import * as message from '~/data/models/message'

export const models = {
  channel,
  message,
}
```

**types.ts:**

```ts
import type { TableInsertRow, TableUpdateRow } from 'over-zero'
import type * as schema from './tables'

export type Channel = TableInsertRow<typeof schema.channel>
export type ChannelUpdate = TableUpdateRow<typeof schema.channel>
```

**tables.ts:**

```ts
export { schema as channel } from '~/data/models/channel'
export { schema as message } from '~/data/models/message'
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

1. scans `models/` for files with `export const schema = table(...)`
2. scans `queries/` for exported arrow functions
3. parses TypeScript AST to extract parameter types
4. converts types to valibot schemas using typebox-codegen
5. wraps query functions in `syncedQuery()` with validators
6. handles special cases (void params, user → userPublic mapping)
7. groups query imports by source file

queries with no parameters get wrapped in `v.parser(v.tuple([]))` while queries
with params get validators like `v.parser(v.tuple([v.object({ ... })]))`.

exports named `permission` are automatically skipped during query generation.

## setup

client:

```tsx
import { createZeroClient } from 'over-zero'
import { schema } from '~/data/schema'
import { models } from '~/data/generated/models'
import * as groupedQueries from '~/data/generated/groupedQueries'

export const { ProvideZero, useQuery, zero, usePermission } = createZeroClient({
  schema,
  models,
  groupedQueries,
})

// in your app root
<ProvideZero
  server="http://localhost:4848"
  userID={user.id}
  auth={jwtToken}
  authData={{ id: user.id, email: user.email, role: user.role }}
>
  <App />
</ProvideZero>
```

server:

```ts
import { createZeroServer } from 'over-zero/server'
import { syncedQueries } from '~/data/generated/syncedQueries'

export const zeroServer = createZeroServer({
  schema,
  models,
  database: process.env.DATABASE_URL,
  queries: syncedQueries, // required for synced queries / pull endpoint
  createServerActions: () => ({
    sendEmail: async (to, subject, body) => { ... }
  })
})

// push endpoint for mutations
app.post('/api/zero/push', async (req) => {
  const authData = await getAuthFromRequest(req)
  const { response } = await zeroServer.handleMutationRequest({
    authData,
    request: req
  })
  return response
})

// pull endpoint for synced queries
app.post('/api/zero/pull', async (req) => {
  const authData = await getAuthFromRequest(req)
  const { response } = await zeroServer.handleQueryRequest({
    authData,
    request: req
  })
  return response
})
```

type augmentation:

```ts
// src/zero/types.ts
import type { schema } from '~/data/schema'
import type { AuthData } from './auth'

declare module 'over-zero' {
  interface Config {
    schema: typeof schema
    authData: AuthData
  }
}
```

### disableInlineQueries

pass `disableInlineQueries: true` to `createZeroClient` to prevent the footgun
pattern of passing inline queries directly to `useQuery`:

```ts
const { useQuery } = createZeroClient({
  schema,
  models,
  groupedQueries,
  disableInlineQueries: true, // recommended
})

// ✅ allowed: function reference + params
const [posts] = useQuery(allPosts, { limit: 20 })

// ❌ type error: inline query bypasses synced queries and permissions
const [posts] = useQuery(zero.query.post.where('userId', id))
```

this prevents a common footgun where inline queries skip the synced query system
and server-side permission checks, causing optimistic updates to be reverted.

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
    asyncTasks: AsyncAction[] // run after transaction
  }
}
```

use it:

```ts
export const mutate = mutations(schema, permissions, {
  async archive(ctx, { messageId }) {
    await ctx.can(permissions, messageId)
    await ctx.tx.mutate.message.update({ id: messageId, archived: true })

    ctx.server?.asyncTasks.push(async () => {
      await ctx.server.actions.indexForSearch(messageId)
    })
  },
})
```

## patterns

**client-side optimistic updates:**

```ts
zero.mutate.message.update(message).client
```

**wait for server confirmation:**

```ts
const result = await zero.mutate.message.update(message).server
```

**server-only mutations:**

```ts
await zeroServer.mutate(async (tx, mutators) => {
  await mutators.user.insert(tx, user)
})
```

**one-off queries with `run()`:**

run a query once without subscribing. works on both client and server:

```ts
import { run } from 'over-zero'
import { userById } from '~/data/queries/user'

// with params
const user = await run(userById, { id: userId })

// without params
const allUsers = await run(allUsers)

// with options (client only)
const cached = await run(userById, { id: userId }, { type: 'unknown' })
```

on client, uses `zero.run()` under the hood. on server, uses transaction-based
execution. same query functions work in both environments.

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
const user = await zeroServer.query((q) => q.user.where('id', userId).one())
```

**batch processing:**

```ts
import { batchQuery } from 'over-zero'

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
