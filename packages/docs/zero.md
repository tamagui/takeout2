---
name: takeout-zero
description: Zero data layer guide. useQuery, zql, mutations, CRUD, permissions, serverWhere, exists(), relations, .related(), pagination, cursor, convergence, optimistic updates.
---

## queries

queries are plain exported functions in `src/data/queries/` that use the global
`zql` builder:

```ts
// src/data/queries/post.ts
import { serverWhere, zql } from 'on-zero'

const permission = serverWhere('post', () => true)

export const allPosts = (props: { limit?: number }) => {
  return zql.post
    .where(permission)
    .orderBy('createdAt', 'desc')
    .limit(props.limit || 20)
}
```

use with `useQuery`:

```tsx
import { useQuery } from '~/zero/client'
import { allPosts } from '~/data/queries/post'

const [posts, status] = useQuery(allPosts, { limit: 20 })
```

### useQuery patterns

```tsx
// with params
useQuery(queryFn, { param1, param2 })

// with params + options
useQuery(queryFn, { param1, param2 }, { enabled: true })

// conditional - only runs when enabled is true
const [data] = useQuery(userById, { userId }, { enabled: Boolean(userId) })
```

## permissions

permissions only execute server-side. use `serverWhere` for query permissions:

```ts
const permission = serverWhere('post', (q, auth) => {
  if (auth?.role === 'admin') return true
  return q.cmp('userId', auth?.id || '')
})
```

for reusable permissions, extract to `src/data/where/`:

```ts
// src/data/where/notBlockedByViewer.ts
export const notBlockedByViewer = serverWhere('post', (q, auth) => {
  if (!auth?.id) return true
  return q.not(q.exists('authorBlockedBy', (block) =>
    block.where('blockerId', auth.id)
  ))
})
```

`exists()` requires a relationship. add to `src/data/relationships.ts`:

```ts
// post -> block via post.userId = block.blockedId
authorBlockedBy: many({
  sourceField: ['userId'],
  destSchema: tables.block,
  destField: ['blockedId'],
})
```

this filters posts where author is blocked, without exposing block data to client.

## relations

include related data with `.related()`:

```ts
export const postWithComments = (props: { postId: string }) => {
  return zql.post
    .where('id', props.postId)
    .one()
    .related('user', (q) => q.one())
    .related('comments', (q) =>
      q.orderBy('createdAt', 'desc')
        .limit(50)
        .related('user', (u) => u.one())
    )
}
```

define relationships in `src/data/relationships.ts`:

```ts
export const postRelationships = relationships(tables.post, ({ one, many }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  comments: many({
    sourceField: ['id'],
    destSchema: tables.comment,
    destField: ['postId'],
  }),
}))
```

## pagination

use `.start()` for cursor-based pagination:

```ts
export const postsPaginated = (props: {
  pageSize: number
  cursor?: { id: string; createdAt: number } | null
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

## models

models in `src/data/models/` define schema, permissions, and mutations:

```ts
// src/data/models/post.ts
import { boolean, number, string, table } from '@rocicorp/zero'
import { mutations, serverWhere } from 'on-zero'

export const schema = table('post')
  .columns({
    id: string(),
    userId: string(),
    caption: string().optional(),
    createdAt: number(),
  })
  .primaryKey('id')

const permissions = serverWhere('post', (q, auth) => {
  return q.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions, {
  insert: async (ctx, post: Post) => {
    await ctx.tx.mutate.post.insert(post)

    if (ctx.server) {
      ctx.server.asyncTasks.push(() =>
        ctx.server.actions.analyticsActions().logEvent(ctx.authData.id, 'post_created')
      )
    }
  },
})
```

passing `schema` and `permissions` to `mutations()` generates CRUD:

```tsx
zero.mutate.post.insert(post)
zero.mutate.post.update(post)
zero.mutate.post.delete(post)
```

### mutation context

```ts
type MutatorContext = {
  tx: Transaction
  authData: AuthData | null
  environment: 'server' | 'client'
  can: (where, obj) => Promise<void>
  server?: {
    actions: ServerActions
    asyncTasks: AsyncAction[]  // runs after transaction commits
  }
}
```

### async tasks

move slow work out of transactions:

```ts
if (ctx.server) {
  ctx.server.asyncTasks.push(async () => {
    await ctx.server.actions.sendPushNotification(message)
  })
}
```

## convergence

mutations run on both client and server - they must produce the same result.

**bad:**

```ts
async insert(ctx, post) {
  await ctx.tx.mutate.post.insert({
    ...post,
    id: randomId(),        // different on each run!
    createdAt: Date.now()  // different timing!
  })
}
```

**good:**

```ts
async insert(ctx, post) {
  // client generates id and timestamp once, passes to mutation
  await ctx.tx.mutate.post.insert(post)

  // server-only side effects are fine
  if (ctx.server) {
    await ctx.server.actions.sendEmail(post)
  }
}
```

## calling mutations

```tsx
// optimistic - updates UI immediately
zero.mutate.post.update(post)

// wait for server confirmation
const result = await zero.mutate.post.update(post).server
```

## anti-patterns

### useAuth() vs useUser()

**bad - waterfall:**

```tsx
const { user } = useUser()  // queries database, waits
const [posts] = useQuery(postsByUserId, { userId: user?.id || '' })
```

**good - immediate:**

```tsx
const { user } = useAuth()  // available immediately from jwt
const [posts] = useQuery(postsByUserId, { userId: user?.id || '' })
```

use `useAuth()` for query params. only use `useUser()` when you need full user
record (profile data, settings).

### n+1 queries in lists

**bad:**

```tsx
function PostCard({ post }) {
  const [author] = useQuery(userById, { userId: post.userId })  // N+1!
  return <div>{author?.username}</div>
}
```

**good:**

```ts
// include relation in query
export const feedPosts = () => {
  return zql.post.related('user', (q) => q.one())
}

function PostCard({ post }) {
  return <div>{post.user?.username}</div>  // already loaded
}
```

### client-side filtering

**bad:**

```tsx
const [blockedUsers] = useQuery(blockedByMe, { userId })
const blockedIds = blockedUsers.map(b => b.blockedId)
const [posts] = useQuery(postsFiltered, { blockedUserIds: blockedIds })
```

**good:**

```ts
// filter server-side with exists()
const notBlocked = serverWhere('post', (q, auth) => {
  if (!auth?.id) return true
  return q.not(q.exists('authorBlockedBy', (b) => b.where('blockerId', auth.id)))
})

export const feedPosts = () => zql.post.where(notBlocked)
```

### index vs detail page queries

design queries so index pages load all data needed for detail pages:

```ts
// feedPosts - used on index, includes everything detail page needs
export const feedPosts = (props: { limit: number }) => {
  return zql.post
    .where(permission)
    .limit(props.limit)
    .related('user', (q) => q.one())
    .related('comments', (q) =>
      q.limit(50).related('user', (u) => u.one())
    )
}

// postDetail - used on detail page, same shape
export const postDetail = (props: { postId: string }) => {
  return zql.post
    .where(permission)
    .where('id', props.postId)
    .one()
    .related('user', (q) => q.one())
    .related('comments', (q) =>
      q.limit(50).related('user', (u) => u.one())
    )
}
```

when navigating from feed to detail, Zero's local cache already has the data from
`feedPosts`, so `postDetail` resolves instantly. the detail query is only slow on
direct navigation (refresh, shared link).

**key insight:** with Zero, "re-querying" isn't expensive if data is synced - the
query runs against local cache. design queries with same relations so cache hits.

## debugging

add `?debug=2` to url for detailed zero logs.

## soft deletes

```ts
// mutation
async delete(ctx, { id }) {
  await ctx.tx.mutate.post.update({ id, deleted: true })
}

// queries filter deleted
.where('deleted', false)
```

## type generation

regenerate after schema changes:

```bash
bun tko zero generate
```

`bun dev` watches and regenerates automatically.

## resources

- zero docs: https://zero.rocicorp.dev
- on-zero: packages/on-zero/readme.md
- models: src/data/models/
- queries: src/data/queries/
