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

it provides a few things:

- **generation** - cli with watch and generate commands
- **queries** - convert plain TS query functions into validated synced queries
- **mutations** - simply create CRUD queries with permissions
- **models** - standardized co-locating schema/permissions/mutations
- **permissions** - `serverWhere` for simple query-based permissions

plus various hooks and helpers for react integration.

models live alongside their permissions and mutations. queries are just
functions that use a global `zql` builder.

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
`serverWhere()` helper automatically accesses auth data from `queryContext()` or
`mutatorContext()` so you don't need to pass it manually.

## models

models co-locate schema, permissions, and mutations in one file:

```ts
// src/data/models/message.ts
import { number, string, table } from '@rocicorp/zero'
import { mutations, serverWhere } from 'on-zero'

export const schema = table('message')
  .columns({
    id: string(),
    content: string(),
    authorId: string(),
    channelId: string(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = serverWhere('message', (q, auth) => {
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

the `serverWhere()` helper automatically gets auth data from `queryContext()` or
`mutatorContext()`, so you don't manually pass it. permissions only execute
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

**for mutations:** define permissions in model files for CRUD operations:

```ts
// src/data/models/message.ts
export const permissions = serverWhere('message', (q, auth) => {
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

on-zero auto-generates glue files that wire up your models, queries, and types.

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
- watches for model changes and regenerates
- enables HMR for mutations (no page reload when editing models)
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

generates all files needed to connect your models and queries:

- `models.ts` - aggregates all model files into a single import
- `types.ts` - generates TypeScript types from table schemas
- `tables.ts` - exports table schemas (separate to avoid circular types)
- `syncedQueries.ts` - generates synced query definitions with valibot
  validators

**options:**

- `dir` - base directory containing `models/` and `queries/` folders (default:
  `src/data`)
- `--watch` - watch for changes and regenerate automatically
- `--after` - command to run after generation completes

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
```

**types.ts:**

```ts
import type { TableInsertRow, TableUpdateRow } from 'on-zero'
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
import { createZeroClient } from 'on-zero'
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
import { createZeroServer } from 'on-zero/server'
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

### server validation hooks

add custom validation for all queries and mutations:

```ts
export const zeroServer = createZeroServer({
  schema,
  models,
  database: process.env.DATABASE_URL,
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

**server-only mutations:**

```ts
await zeroServer.mutate(async (tx, mutators) => {
  await mutators.user.insert(tx, user)
})
```

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
