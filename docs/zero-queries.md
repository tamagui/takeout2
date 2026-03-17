---
name: takeout-zero-queries
description: "Zero queries guide and anti-patterns. useQuery, zql, run(), serverWhere, exists(), permissions, relations, .related(), pagination, cursor, .start(), .one(), .limit(), .where(), .orderBy(), query patterns, conditional queries, enabled, non-reactive queries, cache reads, n+1, useAuth vs useUser, client-side filtering, index vs detail queries."
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

// conditional — only runs when enabled is true
const [data] = useQuery(userById, { userId }, { enabled: Boolean(userId) })
```

### run() — non-reactive

`run()` executes a query once and returns a promise (non-reactive counterpart
to `useQuery`).

#### FOOTGUN ALERT

`run` is a Zero concept, `on-zero` simply makes it easier to use. **run()
defaults to ONLY reading from the client-side cache on the client**! you *can*
pass `run(query, 'complete')` to have it fetch from the server, but this should
be exceptionally rare.

`run` is mostly for server-side use!

```ts
import { run } from 'on-zero'
import { allPosts } from '~/data/queries/post'

// cache only (default on client)
const posts = await run(allPosts, { limit: 10 })

// fetch from server (waits for sync)
const posts = await run(allPosts, { limit: 10 }, 'complete')

// no params
const posts = await run(allPosts)

// no params, fetch from server
const posts = await run(allPosts, 'complete')
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

## anti-patterns

### useAuth() vs useUser()

**bad — waterfall:**

```tsx
const { user } = useUser()  // queries database, waits
const [posts] = useQuery(postsByUserId, { userId: user?.id || '' })
```

**good — immediate:**

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
const notBlocked = serverWhere('post', (q, auth) => {
  if (!auth?.id) return true
  return q.not(q.exists('authorBlockedBy', (b) => b.where('blockerId', auth.id)))
})

export const feedPosts = () => zql.post.where(notBlocked)
```

### index vs detail page queries

design queries so index pages load all data needed for detail pages:

```ts
// feedPosts — used on index, includes everything detail page needs
export const feedPosts = (props: { limit: number }) => {
  return zql.post
    .where(permission)
    .limit(props.limit)
    .related('user', (q) => q.one())
    .related('comments', (q) =>
      q.limit(50).related('user', (u) => u.one())
    )
}

// postDetail — used on detail page, same shape
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

**key insight:** with Zero, "re-querying" isn't expensive if data is synced — the
query runs against local cache. design queries with same relations so cache hits.

## related skills

- `takeout-zero` — overview, when to use each sub-skill
- `takeout-zero-models` — mutations, CRUD, permissions, convergence
- `takeout-zero-setup` — env vars, relationships config, tuning
