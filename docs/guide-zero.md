# Zero Sync System Guide

Zero is the real-time sync system that powers our application, built on
[@rocicorp/zero](https://github.com/rocicorp/zero). This guide covers our
implementation patterns, helpers, and best practices.

## Basic Usage

### Importing Zero

Always import from our wrapped Zero instance, not the raw library:

```tsx
import { useQuery, zero } from '~/zero/client'
```

### Basic Query

The `useQuery` hook returns a tuple of `[data, status]`:

```tsx
const [user, status] = useQuery(zero.query.userPublic.where('id', userId).one())

// status.type can be: 'unknown' | 'complete'
if (status.type !== 'complete') {
  return <Loading />
}
```

### Query with Relations

Zero supports related data fetching via the `.related()` method:

```tsx
const [server, status] = useQuery(
  zero.query.server
    .where('id', serverId)
    .one()
    .related('members')
    .related('roles')
    .related('channels', (q) => q.where('deleted', '!=', true)),
)
```

## Query Patterns

### Conditional Queries

Use the `enabled` option to conditionally run queries:

```tsx
const [data, status] = useQuery(
  zero.query.message.where('channelId', channelId),
  {
    enabled: Boolean(channelId),
  },
)
```

### Query Ordering and Limits

```tsx
const [messages] = useQuery(
  zero.query.message
    .where('channelId', channelId)
    .orderBy('createdAt', 'desc')
    .limit(50),
)
```

### Complex Where Conditions

Use expression builders for complex conditions:

```tsx
const [privateChats] = useQuery(
  zero.query.privateChatsStats
    .where((eb) => eb.or(eb.cmp('userAId', userId), eb.cmp('userBId', userId)))
    .orderBy('score', 'desc')
    .limit(10),
)
```

## The "One Big Query" Pattern

To minimize database thrashing and reduce the number of queries, we use a
pattern of "one big query" that fetches all related data at once. The primary
example is `useCurrentServer`:

```tsx
// src/features/server/useCurrentServer.ts
export const useCurrentServer = () => {
  const serverId = useCurrentServerId()
  const channelId = useCurrentChannelId()
  const userId = auth.user?.id

  const [server] = useQuery(
    zero.query.server
      .where('id', serverId)
      .one()
      .related('members')
      .related('member', (q) => q.where('id', userId).one())
      .related('roles')
      .related('apps')
      .related('channel', (q) =>
        q
          .where('id', channelId)
          .one()
          .related('appInstalls')
          .related('permissions')
          .related('notifications'),
      )
      .related('topPrivateChats', (q) => q.orderBy('score', 'desc').limit(10)),
  )

  return {
    server,
    channel: server?.channel,
    members: server?.members,
    roles: server?.roles,
  }
}
```

### Benefits of One Big Query

- Reduced database round-trips: Fetches all data in a single query
- Reduced waterfalls: Components don't base new queries off old ones

In general you want to pass your route params directly to queries doing a
`.where('id', params.id)`. We often put this in a context helper so it's
available wherever you need it.

### Trade-offs

- Over-fetching: May load more data than needed for some views
- Memoization challenges: Large objects are recreated on every update
- Complex query structure: Can become difficult to maintain

## Mutations

Zero provides typed mutations for all tables. Always use the mutate API:

### Basic Mutations

```tsx
// insert
await zero.mutate.message.insert({
  id: randomId(),
  content: 'Hello world',
  channelId,
  serverId,
  creatorId: userId,
})

// update
await zero.mutate.server.update({
  id: serverId,
  name: 'New Server Name',
})

// delete
await zero.mutate.message.delete({
  id: messageId,
})
```

### Waiting for mutations

In general on the client you wait just for .client

```tsx
await zero.mutate.user.migrate(userId).client
```

But you can also wait for the server mutation to be successful:

```tsx
await zero.mutate.user.migrate(userId).server
```

## Permissions

We have a comprehensive permission system that enforces CRUD operations at the
model level. Permissions are defined alongside each model in `src/data/models/`
and are automatically enforced for all mutations.

### Defining Permissions

Permissions are defined using a query builder pattern alongside table schemas:

```tsx
// src/data/models/message.ts
import { builder } from '~/data/helpers/builder'

export const permissions = builder('message', (eb, ctx) => {
  const userId = ctx.authData?.id || ''

  const isCreator = eb.cmp('creatorId', userId)
  const isChannelMember = eb.exists('channel', (q) =>
    q.whereExists('member', (q) => q.where('id', userId)),
  )

  return {
    read: isChannelMember,
    write: eb.and(isCreator, isChannelMember),
  }
})
```

### Using usePermission Hook

Check if the current user has permission for an operation:

```tsx
import { usePermission } from '~/data/permissions/helpers/usePermission'

const canDelete = usePermission('message', 'write', message, enabled)

if (canDelete) {
  // show delete button
}
```

### How Permissions Work

1. Model-level definition: Each model defines its own read/write permissions
2. Automatic enforcement: Mutations automatically check permissions
3. Query-based: Permissions are Zero queries that run efficiently
4. Context-aware: Permissions have access to auth data and can check
   relationships
5. Reusable helpers: Common permission patterns are extracted to
   `src/data/permissions/`

Example of reusable permission helpers:

```tsx
// src/data/permissions/channel.ts
export const hasChannelRole = (eb, ctx) => {
  const userId = ctx.authData?.id || ''
  return eb.exists('channel', (q) =>
    q.whereExists('role', (q) =>
      q.whereExists('member', (q) => q.where('id', userId)),
    ),
  )
}

// used in models:
export const permissions = builder('message', (eb, ctx) => {
  return {
    read: hasChannelRole(eb, ctx),
    write: hasChannelRole(eb, ctx),
  }
})
```

## Memoization and Performance

### The Memoization Problem

Zero recreates all objects on every update, breaking React's memoization. Even
if only one message in a list changes, all message objects are new, causing
unnecessary re-renders.

### Current Solution: useMemoizedObjectList

We use a custom hook that maintains object identity when content hasn't changed:

```tsx
import { useMemoizedObjectList } from '~/hooks/useMemoizedObjectList'

const ChannelMainMessagesList = () => {
  const [messages] = useQuery(/* ... */)

  // preserve object identity for unchanged messages
  const memoizedMessages = useMemoizedObjectList(messages || [], 'id')

  return <MessagesList messages={memoizedMessages} />
}
```

### How useMemoizedObjectList Works

1. Maintains a cache of objects by their identity key
2. Compares new objects with cached versions using deep equality
3. Reuses cached object if content is unchanged
4. Returns new array only if items changed

Warning: This hook currently leaks memory as it never clears the cache. It's
still better for performance in general, but note it's a temporary solution
until Zero implements internal memoization.

## Helpers and Utilities

### Auth Integration

Zero is automatically configured with auth credentials and integrates with our
better-auth implementation:

```tsx
// src/zero/zero.ts
const instance = new Zero({
  userID: auth?.userId || 'anon',
  auth: auth?.jwtToken || '',
  kvStore: isWeb && isClient && auth ? 'idb' : 'mem',
})
```

### Choosing Between useAuth and useUser

We have two hooks for accessing user data, each optimized for different use cases:

**useAuth** - Fast, localStorage-based auth state:
```tsx
import { useAuth } from '~/features/auth/client/authClient'

const { user } = useAuth()

// Use when threading userId into queries
const [posts] = useQuery(
  zero.query.post.where('userId', user?.id || ''),
  { enabled: !!user?.id }
)
```

**useUser** - Synced user data from Zero:
```tsx
import { useUser } from '~/features/user/useUser'

const { user } = useUser()

// Use when displaying user data in UI
return <Text>{user?.name}</Text>
```

**Rule of thumb:**
- `useAuth`: When you need `user.id` for query conditions (fast, no sync overhead)
- `useUser`: When you need to display user properties like name, image, etc.

### Debug Proxy

In development, queries are wrapped with a debug proxy for logging:

```tsx
// automatically enabled when DEBUG_LEVEL is set
if (DEBUG_LEVEL) {
  return debugZeroProxy(instance)
}
```

Add `?debug=2` to see more information on zero queries.

## Advanced Patterns

### Custom Query Helpers

Create reusable query builders:

```tsx
// src/features/message/queryMessageItemRelations.ts
export const queryMessageItemRelations = (query, serverId) => {
  return query
    .related('creator')
    .related('reactions', (q) => q.related('creator'))
    .related('thread', (q) => q.related('messages', (q) => q.limit(1)))
}
```

### Conditional Relations

Load relations based on conditions:

```tsx
const [server] = useQuery(
  zero.query.server
    .where('id', serverId)
    .one()
    .related('notifications', (q) => {
      return userId
        ? q.where('userId', userId).where('seenAt', 'IS', null)
        : q.limit(0)
    }),
)
```

## Migration and Schema Updates

You just change the `tables.ts` or `relationships.ts`, we have a watcher that
runs in development in docker-compose that handles migrating the DB for you, or
you can run `bun migrate`.

## Resources

- [Zero Documentation](https://github.com/rocicorp/zero)
- Internal Zero wrapper: `/src/zero/zero.ts`
- Model definitions: `/src/data/models/`
- Permission system: `/src/data/helpers/builder.ts`
- Mutation helper: `/src/data/helpers/mutations.ts`
- Current server hook: `/src/features/server/useCurrentServer.ts`
- Memoization helper: `/src/hooks/useMemoizedObjectList.ts`
