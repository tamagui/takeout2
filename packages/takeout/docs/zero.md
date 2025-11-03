# zero sync guide

zero powers offline-first sync in this app via postgres replication. this guide
covers our patterns using over-zero.

## queries

queries are plain functions using the `zql` builder:

```ts
// src/data/queries/message.ts
import { zql } from 'over-zero'

export const channelMessages = (props: { channelId: string }) => {
  return zql.message
    .where('channelId', props.channelId)
    .where('deleted', false)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .related('creator', (q) => q.one())
}
```

use with `useQuery`:

```tsx
import { useQuery } from '~/zero/client'
import { channelMessages } from '~/data/queries/message'

const [messages, status] = useQuery(channelMessages, { channelId })

if (status.type !== 'complete') {
  return <Loading />
}
```

the function name becomes the synced query name. `useQuery` lazily creates a
`SyncedQuery` and caches it per function.

## useQuery patterns

three ways to call it:

```tsx
// with params
useQuery(queryFn, { param1, param2 })

// with params + options
useQuery(queryFn, { param1, param2 }, { enabled: true })

// no params + options
useQuery(queryFn, { enabled: true })
```

conditional queries:

```tsx
const [data] = useQuery(userMessages, { userId }, { enabled: Boolean(userId) })
```

## query organization

queries live in `src/data/queries/` organized by model:

```
src/data/queries/
├── message.ts       # message queries + read permission
├── channel.ts       # channel queries + read permission
├── user.ts          # user queries + read permission
└── server.ts        # server queries + read permission
```

import directly from the file:

```ts
import { latestNotifications } from '~/data/queries/notification'
import { currentServer } from '~/data/queries/server'
```

## the big query pattern

fetch all related data in one query to avoid waterfalls:

```tsx
// src/features/server/useCurrentServer.ts
const [server] = useQuery(
  currentServer,
  {
    serverId,
    channelId,
    userId,
    topicsGreaterThan: Date.now() - time.ms.days(30),
  },
  {
    enabled: Boolean(serverId && channelId),
  },
)

// returns server with:
// - members, roles, apps
// - current channel with topics, notifications, meeting
// - top private chats
```

this reduces round trips and prevents components from chaining queries.

## complex conditions

use expression builder for advanced filtering:

```tsx
const privateChats = (props: { userId: string }) => {
  return zql.privateChatsStats
    .where((eb) =>
      eb.or(eb.cmp('userAId', props.userId), eb.cmp('userBId', props.userId)),
    )
    .orderBy('score', 'desc')
    .limit(10)
}
```

## relations

zero supports nested relations:

```tsx
const serverWithEverything = (props: { serverId: string }) => {
  return zql.server
    .where('id', props.serverId)
    .one()
    .related('channels', (q) =>
      q.related('messages', (m) => m.orderBy('createdAt', 'desc').limit(10)),
    )
}
```

conditional relations:

```tsx
.related('notifications', q => {
  return props.userId
    ? q.where('userId', props.userId).where('seenAt', 'IS', null)
    : q.limit(0)
})
```

## reusable query helpers

extract common patterns:

```ts
// src/features/message/queryMessageItemRelations.ts
export const queryMessageItemRelations = (query, serverId) => {
  return query
    .related('creator', (q) => q.one())
    .related('reactions', (q) => q.related('creator'))
    .related('attachments')
    .related('thread', (q) => q.related('messages', (m) => m.limit(1)))
}

// use it:
const messages = (props: { channelId: string; serverId: string }) => {
  return queryMessageItemRelations(
    zql.message.where('channelId', props.channelId),
    props.serverId,
  )
}
```

## permissions in queries

read permissions live in query files:

```ts
// src/data/queries/message.ts
import { where } from 'over-zero'

const permission = where('message', (q, auth) => {
  if (auth?.role === 'admin') return true

  const canReadChannel = hasChannelReadPermission(q, auth)
  return q.and(q.cmp('deleted', '!=', true), canReadChannel)
})
```

these permissions are enforced server-side when zero processes the query.

## mutations

quick reference:

```tsx
// optimistic client update
await zero.mutate.message.update(message).client

// wait for server
await zero.mutate.message.update(message).server

// custom mutation
await zero.mutate.message.send({ content, channelId })
```

# zero mutations guide

mutations write data to the database with server-side validation and permission
checks.

## defining mutations

mutations live in `src/data/models/` alongside schema and permissions:

```ts
// src/data/models/message.ts
import { table, mutations, where } from 'over-zero'
import { string, number, boolean } from '@rocicorp/zero'

export const schema = table('message')
  .columns({
    id: string(),
    content: string(),
    authorId: string(),
    channelId: string(),
    deleted: boolean(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('message', (q, auth) => {
  return q.cmp('authorId', auth?.id || '')
})

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
  },
})
```

## auto-generated crud

passing `schema` and `permissions` to `mutations()` generates:

```ts
zero.mutate.message.insert(message)
zero.mutate.message.update(message)
zero.mutate.message.delete(message)
zero.mutate.message.upsert(message)
```

these check permissions automatically on the server.

## mutation context

every mutation receives `MutatorContext`:

```ts
type MutatorContext = {
  tx: Transaction // database transaction
  authData: AuthData | null // current user
  environment: 'server' | 'client' // where running
  can: (where, obj) => Promise<void> // check permissions
  server?: {
    actions: ServerActions // async server functions
    asyncTasks: AsyncAction[] // queue post-transaction work
  }
}
```

use it:

```ts
export const mutate = mutations(schema, permissions, {
  async archive(ctx, messageId: string) {
    const { tx, authData, can, server } = ctx

    await can(permissions, messageId)

    await tx.mutate.message.update({
      id: messageId,
      archived: true,
    })

    server?.asyncTasks.push(async () => {
      await server.actions.updateSearchIndex(messageId)
    })
  },
})
```

## calling mutations

from components:

```tsx
import { zero } from '~/zero/client'

// optimistic - returns immediately
await zero.mutate.message.send({ content, channelId }).client

// blocking - waits for server
const result = await zero.mutate.message.send({ content, channelId }).server
```

server-only mutations:

```ts
import { zeroServer } from '~/zero/server'

await zeroServer.mutate(async (tx, mutators) => {
  await mutators.user.insert(tx, {
    id: randomId(),
    email: 'user@example.com',
    createdAt: Date.now(),
  })
})
```

## permissions

write permissions return a condition or boolean:

```ts
export const permissions = where('channel', (q, auth) => {
  if (auth?.role === 'admin') return true

  return q.or(
    q.cmp('creatorId', auth?.id),
    q.exists('members', (m) => m.where('userId', auth?.id)),
  )
})
```

check in mutations:

```ts
await ctx.can(permissions, channelId) // throws if denied
```

check in react:

```tsx
import { usePermission } from '~/zero/client'

const canEdit = usePermission('channel', channelId)
if (!canEdit) return null
```

## async tasks

queue work to run after transaction commits:

```ts
export const mutate = mutations(schema, permissions, {
  async createMessage(ctx, message: Message) {
    await ctx.tx.mutate.message.insert(message)

    if (ctx.server) {
      ctx.server.asyncTasks.push(async () => {
        await ctx.server.actions.sendPushNotification(message)
        await ctx.server.actions.indexForSearch(message)
        await ctx.server.actions.runAutomations(message)
      })
    }
  },
})
```

tasks run in parallel after the transaction. keep transactions fast - move slow
work to async tasks.

## server actions

define server-only functions:

```ts
// src/data/server/createServerActions.ts
export const createServerActions = () => ({
  async sendEmail(to: string, subject: string, body: string) {
    await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    })
  },

  async generateAISummary(content: string) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
    return response.json()
  },
})
```

use in mutations:

```ts
const summary = await ctx.server.actions.generateAISummary(content)
```

## convergence

mutations run on both client and server. they must produce the same result.

bad (non-convergent):

```ts
async insert(ctx, message) {
  await ctx.tx.mutate.message.insert({
    ...message,
    id: randomId(),        // different on each run!
    createdAt: Date.now()  // different timing!
  })
}
```

good (convergent):

```ts
async insert(ctx, message) {
  // client generates these once
  await ctx.tx.mutate.message.insert(message)

  // server-only side effects don't affect data
  if (ctx.server) {
    await ctx.server.actions.sendEmail(message)
  }
}
```

pass all random/time values from the client.

## cross-model mutations

create multiple related records atomically:

```ts
export const mutate = mutations(schema, permissions, {
  async acceptFriendship(ctx, friendshipId: string) {
    await ctx.tx.mutate.friendship.update({
      id: friendshipId,
      accepted: true,
    })

    // create private server for the friendship
    const privateServerId = randomId()
    await ctx.tx.mutate.server.insert({
      id: privateServerId,
      isPrivateChat: true,
      createdAt: Date.now(),
    })

    await ctx.tx.mutate.channel.insert({
      id: privateServerId,
      serverId: privateServerId,
      createdAt: Date.now(),
    })

    // add both users as members
    await ctx.tx.mutate.serverMember.insert({
      userId: ctx.authData!.id,
      serverId: privateServerId,
    })
  },
})
```

## soft deletes

prefer soft deletes over hard deletes:

```ts
export const mutate = mutations(schema, permissions, {
  async delete(ctx, messageId: string) {
    await ctx.tx.mutate.message.update({
      id: messageId,
      deleted: true,
    })
  },
})
```

then filter in queries:

```ts
.where('deleted', false)
```

## permission helpers

reusable permission patterns live in `src/data/where/`:

```ts
// src/data/where/channel.ts
export const hasChannelReadPermission = (q, auth) => {
  return q.or(
    q.cmp('public', true),
    q.exists('members', (m) => m.where('userId', auth?.id)),
    hasServerAdminPermission(q, auth),
  )
}

// use in models:
export const permissions = where('message', (q, auth) => {
  return q.and(q.cmp('authorId', auth?.id), hasChannelReadPermission(q, auth))
})
```

## context helpers

```ts
import { mutatorContext, ensureLoggedIn } from 'over-zero'

// get current context
const ctx = mutatorContext()

// assert logged in
const auth = ensureLoggedIn() // throws if null
```

## batch operations

process large datasets:

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

## error handling

mutations throw on permission failures:

```tsx
try {
  await zero.mutate.message.delete({ id: messageId }).server
} catch (error) {
  showToast('Failed to delete message')
}
```

server validates all mutations. permission errors are logged but don't expose
sensitive data to clients.

## testing mutations

```ts
import { zeroServer } from '~/zero/server'

test('user can update own message', async () => {
  await zeroServer.mutate(
    async (tx, mutators) => {
      await mutators.message.update(tx, {
        id: 'msg-1',
        content: 'updated',
      })
    },
    { id: 'user-1', email: 'user@test.com', role: undefined },
  )
})
```

## type generation

when you add or modify schemas, regenerate types:

```bash
bun zero:generate
```

this creates typescript types from your table schemas in
`src/data/generated/types.ts`:

```ts
export type Message = TableInsertRow<typeof schema.message>
export type MessageUpdate = TableUpdateRow<typeof schema.message>
```

use them in mutations:

```ts
import type { Message } from '~/data/types'

export const mutate = mutations(schema, permissions, {
  async create(ctx, message: Message) {
    await ctx.tx.mutate.message.insert(message)
  },
})
```

in development, `bun dev` runs `zero:generate:watch` automatically.

## migration

schema changes auto-migrate in development via docker-compose watching model
files.

in production, run:

```bash
bun migrate
```

this runs drizzle migrations and updates zero's cvr database.

## performance tips

**one query per route** - fetch all needed data upfront **limit relations** -
each `.related()` adds joins **use indexes** - add to postgres schema for
frequently queried fields **avoid n+1** - fetch related data with `.related()`
instead of separate queries **paginate** - use `.limit()` and offset patterns
for large lists

## schema and migrations

schema lives in `src/data/models/` using zero's table builder:

```ts
// src/data/models/message.ts
import { table, string, number } from '@rocicorp/zero'

export const schema = table('message')
  .columns({
    id: string(),
    content: string(),
    createdAt: number(),
  })
  .primaryKey('id')
```

relationships in `src/data/relationships.ts`:

```ts
import { defineRelationships } from '@rocicorp/zero'

export const relationships = defineRelationships(tables, {
  message: {
    creator: {
      sourceField: ['creatorId'],
      destSchema: tables.userPublic,
      destField: ['id'],
    },
  },
})
```

to migrate: just edit model files or relationships.ts. in development,
docker-compose auto-migrates. in production, run `bun migrate`.

## type generation

over-zero auto-generates typescript types from your schemas. run:

```bash
bun zero:generate
```

this generates `src/data/generated/types.ts`:

```ts
import type { TableInsertRow, TableUpdateRow } from 'over-zero'

export type Message = TableInsertRow<typeof schema.message>
export type MessageUpdate = TableUpdateRow<typeof schema.message>
```

use these types throughout your app:

```ts
import type { Message, MessageUpdate } from '~/data/types'

const message: Message = {
  id: randomId(),
  content: 'hello',
  createdAt: Date.now(),
}

const update: MessageUpdate = {
  id: message.id,
  content: 'updated',
}
```

in development, run with watch mode:

```bash
bun zero:generate:watch
```

this watches your model files and regenerates types automatically. the main dev
script runs this for you.

## performance

**query count:** aim for one query per route. use the big query pattern.

**relations:** be careful with `.related()` - each adds joins. profile slow
queries.

**limits:** always use `.limit()` on potentially large result sets.

**indexes:** zero syncs via postgres - add indexes to your postgres schema for
performance.

**memoization:** zero recreates objects on every update. use `useMemo` for
expensive derivations.

## debugging

development mode tracks query changes:

```tsx
// warns if query AST changes 4+ times in one component
const [data] = useQuery(
  messages,
  { channelId }, // if channelId changes often, this reruns
)
```

add `?debug=2` to url for detailed zero logs.

check query performance in postgres:

```sql
SELECT * FROM pg_stat_statements
WHERE query LIKE '%message%'
ORDER BY total_exec_time DESC;
```

## common patterns

**pagination:**

```tsx
const [messages] = useQuery(channelMessages, {
  channelId,
  fromOrder: lastMessage?.order,
  limit: 50,
})
```

**filtering:**

```tsx
const unreadMessages = (props: { channelId: string; userId: string }) => {
  return zql.message
    .where('channelId', props.channelId)
    .whereNotExists('seen', (q) => q.where('userId', props.userId))
}
```

**aggregations:** use postgres views or denormalized fields. zero doesn't
support SQL aggregations directly.

## resources

- zero docs: https://zero.rocicorp.dev
- over-zero readme: packages/over-zero/README.md
- models: src/data/models/
- queries: src/data/queries/
- schema: src/data/tables.ts
- client setup: src/zero/client.tsx
- server setup: src/zero/server.ts
