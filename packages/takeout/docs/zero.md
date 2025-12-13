# zero sync guide

zero powers offline-first sync in this app via postgres replication. this guide
covers patterns using over-zero.

## queries

queries are plain exported functions in `src/data/queries/` that use the global
`zql` builder:

```ts
// src/data/queries/post.ts
import { where, zql } from 'over-zero'

const permission = where('post', () => {
  return true
})

export const allPosts = (props: { limit?: number }) => {
  return zql.post
    .where(permission)
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.limit || 20)
}
```

the `zql` builder is the standard Zero query builder typed to your schema. each
exported function automatically becomes a synced query when you run
`over-zero generate`.

the `bun dev` command runs `bun watch` which automatically watches and
re-generates queries for you, so if that's running you don't need to
re-generate.

### using queries

use with `useQuery`:

```tsx
import { useQuery } from '~/zero/client'
import { allPosts } from '~/data/queries/post'

const [posts, status] = useQuery(allPosts, { limit: 20 })

if (status.type !== 'complete') {
  return <Loading />
}
```

`useQuery` detects plain functions, creates a cached `SyncedQuery` per function,
and calls it with your params.

### useQuery patterns

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
const [data] = useQuery(userById, { userId }, { enabled: Boolean(userId) })
```

### query generation

when you run `over-zero generate`, it scans your query files and creates
`src/data/generated/syncedQueries.ts`:

```ts
// auto-generated
import * as v from 'valibot'
import { syncedQuery } from '@rocicorp/zero'
import * as postQueries from '../queries/post'

export const allPosts = syncedQuery(
  'allPosts',
  v.parser(
    v.tuple([
      v.object({
        limit: v.optional(v.number()),
      }),
    ]),
  ),
  (arg) => {
    return postQueries.allPosts(arg)
  },
)
```

this wraps your query functions with valibot validators for runtime type safety.
don't even import from the "generated" folder.

## query permissions

define permissions inline in query files using `where()`:

```ts
// src/data/queries/user.ts
const permission = where('userPublic', () => {
  return true // public access
})

export const userById = (props: { userId: string }) => {
  return zql.userPublic.where(permission).where('id', props.userId).one()
}
```

permissions with auth checks:

```ts
const permission = where('userPublic', (q, auth) => {
  if (auth?.role === 'admin') return true
  return q.cmp('id', auth?.id || '')
})
```

the `where()` helper automatically accesses auth data from `queryContext()` or
`mutatorContext()`. permissions only execute server-side - on the client they
automatically pass.

### reusable permission helpers

extract common patterns to `src/data/where/`. note that we use "serverWhere" as
these conditions will only run on the server, where permissions should be
enforced.

```ts
// src/data/where/isUsersOwn.ts
import { where } from 'over-zero'

export const isUsersOwn = serverWehere<'userPublic'>((q, auth) =>
  q.cmp('id', '=', auth?.id || ''),
)
```

use in queries:

```ts
import { isUsersOwn } from '~/data/where/isUsersOwn'

export const currentUser = (props: { userId: string }) => {
  return zql.userPublic.where(isUsersOwn).where('id', props.userId).one()
}
```

## complex conditions

use expression builder for advanced filtering:

```tsx
const postsWithBlocks = (props: {
  userId?: string
  blockedUserIds: string[]
  pageSize: number
}) => {
  return zql.post
    .where((eb) => {
      if (props.blockedUserIds.length > 0) {
        return eb.not(eb.cmp('userId', 'IN', props.blockedUserIds))
      }
      return eb.cmp('id', '!=', '')
    })
    .orderBy('createdAt', 'desc')
    .limit(props.pageSize)
}
```

## relations

zero supports nested relations:

```tsx
export const userWithState = (props: { userId: string }) => {
  return zql.userPublic
    .where('id', props.userId)
    .one()
    .related('state', (q) => q.where('userId', props.userId).one())
}
```

define relationships in `src/data/relationships.ts`:

```ts
import { relationships } from '@rocicorp/zero'
import * as tables from './generated/tables'

export const userRelationships = relationships(
  tables.userPublic,
  ({ many, one }) => ({
    state: one({
      sourceField: ['id'],
      destSchema: tables.userState,
      destField: ['userId'],
    }),
    posts: many({
      sourceField: ['id'],
      destSchema: tables.post,
      destField: ['userId'],
    }),
  }),
)
```

## pagination

use `.start()` for cursor-based pagination:

```ts
export const postsPaginated = (props: {
  pageSize: number
  cursor?: { id: string } | null
}) => {
  let query = zql.post
    .orderBy('createdAt', 'desc')
    .orderBy('id', 'desc')
    .limit(props.pageSize)

  if (props.cursor) {
    query = query.start(props.cursor)
  }

  return query
}
```

## query organization

queries live in `src/data/queries/` organized by model:

```
src/data/queries/
├── post.ts       # post queries + read permissions
├── user.ts       # user queries + read permissions
└── block.ts      # block queries + read permissions
```

import directly from the file:

```ts
import { allPosts, postById } from '~/data/queries/post'
import { userById } from '~/data/queries/user'
```

## models

models live in `src/data/models/` and define schema, permissions, and mutations:

```ts
// src/data/models/post.ts
import { boolean, number, string, table } from '@rocicorp/zero'
import { mutations, where } from 'over-zero'
import type { Post } from '../types'

export const schema = table('post')
  .columns({
    id: string(),
    userId: string(),
    image: string(),
    caption: string().optional(),
    hiddenByAdmin: boolean(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

const permissions = where('post', (q, auth) => {
  return q.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, environment, server, authData }, post: Post) => {
    await tx.mutate.post.insert(post)

    if (environment === 'server' && server && authData) {
      server.asyncTasks.push(() =>
        server.actions
          .analyticsActions()
          .logEvent(authData.id, 'post_created', {
            postId: post.id,
          }),
      )
    }
  },
})
```

### auto-generated crud

passing `schema` and `permissions` to `mutations()` generates CRUD operations:

```tsx
zero.mutate.post.insert(post)
zero.mutate.post.update(post)
zero.mutate.post.delete(post)
zero.mutate.post.upsert(post)
```

these check permissions automatically on the server.

### custom mutations

add custom mutations to the third argument:

```ts
export const mutate = mutations(schema, permissions, {
  async customAction(ctx, props: { id: string }) {
    await ctx.can(permissions, props.id)
    await ctx.tx.mutate.post.update({ id: props.id, updated: true })
  },
})
```

call from client:

```tsx
await zero.mutate.post.customAction({ id: 'post-1' })
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
  async archive(ctx, { postId }) {
    await ctx.can(permissions, postId)
    await ctx.tx.mutate.post.update({ id: postId, archived: true })

    if (ctx.server) {
      ctx.server.asyncTasks.push(async () => {
        await ctx.server.actions.updateSearchIndex(postId)
      })
    }
  },
})
```

### async tasks

queue work to run after transaction commits:

```ts
if (ctx.server) {
  ctx.server.asyncTasks.push(async () => {
    await ctx.server.actions.sendPushNotification(message)
    await ctx.server.actions.indexForSearch(message)
  })
}
```

tasks run in parallel after the transaction. keep transactions fast - move slow
work to async tasks.

### server actions

define server-only functions in `src/data/server/createServerActions.ts`:

```ts
export const createServerActions = () => ({
  analyticsActions: () => ({
    async logEvent(userId: string, event: string, data: any) {
      // analytics logic
    },
  }),

  async sendEmail(to: string, subject: string, body: string) {
    await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    })
  },
})
```

use in mutations:

```ts
ctx.server.actions.analyticsActions().logEvent(userId, 'event_name', data)
```

## convergence

mutations run on both client and server. they must produce the same result.

bad (non-convergent):

```ts
async insert(ctx, post) {
  await ctx.tx.mutate.post.insert({
    ...post,
    id: randomId(),        // different on each run!
    createdAt: Date.now()  // different timing!
  })
}
```

good (convergent):

```ts
async insert(ctx, post) {
  // client generates id and timestamp once
  await ctx.tx.mutate.post.insert(post)

  // server-only side effects don't affect data
  if (ctx.server) {
    await ctx.server.actions.sendEmail(post)
  }
}
```

pass all random/time values from the client.

## type generation

when you add or modify schemas, regenerate types:

```bash
over-zero generate
```

or use the project's alias:

```bash
bun tko zero generate
```

this creates:

- `src/data/generated/types.ts` - TypeScript types from schemas
- `src/data/generated/tables.ts` - table schema exports
- `src/data/generated/models.ts` - model aggregation
- `src/data/generated/syncedQueries.ts` - synced query definitions with validators

use generated types:

```ts
import type { Post, PostUpdate, User } from '~/data/types'

const post: Post = {
  id: randomId(),
  userId: 'user-1',
  image: 'https://...',
  caption: 'hello',
  hiddenByAdmin: false,
  createdAt: Date.now(),
}

const update: PostUpdate = {
  id: post.id,
  caption: 'updated',
}
```

in development, `bun dev` runs `watch:zero:generate` automatically.

## schema organization

schema lives in `src/data/`:

```
src/data/
├── models/           # model definitions with mutations
│   ├── post.ts
│   ├── user.ts
│   └── block.ts
├── queries/          # query functions
│   ├── post.ts
│   ├── user.ts
│   └── block.ts
├── where/            # reusable permission helpers
│   └── isUsersOwn.ts
├── server/           # server-only code
│   └── createServerActions.ts
├── generated/        # auto-generated files
│   ├── types.ts
│   ├── tables.ts
│   ├── models.ts
│   └── syncedQueries.ts
├── relationships.ts  # relationship definitions
├── schema.ts         # schema assembly
└── types.ts          # type exports + custom types
```

## setup

### client setup

```tsx
// src/zero/client.tsx
import { createZeroClient } from 'over-zero'
import { schema } from '~/data/schema'
import { models } from '~/data/generated/models'

export const { ProvideZero, useQuery, zero, usePermission } = createZeroClient({
  schema,
  models,
})

// in your app root
<ProvideZero
  server="http://localhost:4848"
  userID={user.id}
  auth={jwtToken}
  authData={{ id: user.id, role: user.role }}
  kvStore="idb" // or "mem"
>
  <App />
</ProvideZero>
```

### server setup

```ts
// src/zero/server.ts
import { createZeroServer } from 'over-zero/server'
import { schema } from '~/data/schema'
import { models } from '~/data/generated/models'
import * as queries from '~/data/generated/queries'
import { createServerActions } from '~/data/server/createServerActions'

export const zeroServer = createZeroServer({
  schema,
  models,
  queries,
  createServerActions,
  database: process.env.ZERO_UPSTREAM_DB,
})
```

### type augmentation

```ts
// src/zero/types.ts
import type { schema } from '~/data/schema'
import type { AuthData } from '~/features/auth/types'

declare module 'over-zero' {
  interface Config {
    schema: typeof schema
    authData: AuthData
  }
}
```

## permissions

permissions use the `where()` helper to create conditions:

```ts
export const permissions = where('post', (q, auth) => {
  if (auth?.role === 'admin') return true
  return q.cmp('userId', auth?.id || '')
})
```

**for queries:** define inline as constants in query files

**for mutations:** define in model files and pass to `mutations()`

check in mutations:

```ts
await ctx.can(permissions, postId)
```

check in react:

```tsx
const canEdit = usePermission('post', postId)
if (!canEdit) return null
```

## calling mutations

optimistic client update:

```tsx
await zero.mutate.post.update(post)
```

wait for server confirmation:

```tsx
const result = await zero.mutate.post.update(post).server
```

## performance tips

- **one query per route** - fetch all needed data upfront
- **limit relations** - each `.related()` adds joins
- **use indexes** - add to postgres schema for frequently queried fields
- **avoid n+1** - fetch related data with `.related()` instead of separate
  queries
- **paginate** - use `.limit()` and `.start()` for large lists
- **memoization** - zero recreates objects on updates, use `useMemo` for
  expensive derivations

## debugging

add `?debug=2` to url for detailed zero logs.

check query performance in postgres:

```sql
SELECT * FROM pg_stat_statements
WHERE query LIKE '%post%'
ORDER BY total_exec_time DESC;
```

development mode warns if query AST changes frequently in a component.

## common patterns

### filtering with conditions

```tsx
const activeUsers = (props: { minPosts: number }) => {
  return zql.userPublic
    .where((eb) => eb.cmp('postsCount', '>=', props.minPosts))
    .orderBy('joinedAt', 'desc')
}
```

### soft deletes

```ts
export const mutate = mutations(schema, permissions, {
  async delete(ctx, { id }) {
    await ctx.tx.mutate.post.update({
      id,
      deleted: true,
    })
  },
})
```

filter in queries:

```ts
.where('deleted', false)
```

### cross-model mutations

```ts
export const mutate = mutations(schema, permissions, {
  async createWithRelated(ctx, props: { userId: string }) {
    const postId = randomId()

    await ctx.tx.mutate.post.insert({
      id: postId,
      userId: props.userId,
      createdAt: Date.now(),
    })

    await ctx.tx.mutate.userPublic.update({
      id: props.userId,
      postsCount:
        (await ctx.tx.query.userPublic.where('id', props.userId).one().run())
          ?.postsCount + 1,
    })
  },
})
```

## migration

schema changes in `src/data/models/*.ts` auto-migrate in development via
docker-compose watching model files.

in production, run:

```bash
bun migrate
```

this runs drizzle migrations and updates zero's cvr database.

## resources

- zero docs: https://zero.rocicorp.dev
- over-zero readme: packages/over-zero/readme.md
- models: src/data/models/
- queries: src/data/queries/
- schema: src/data/schema.ts
- relationships: src/data/relationships.ts
- client setup: src/zero/client.tsx
- server setup: src/zero/server.ts
