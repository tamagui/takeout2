---
name: takeout-zero-models
description: Zero models, mutations, CRUD — schema, table(), permissions, MutatorContext, optimistic updates, soft deletes.
---

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

## mutation context

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

## async tasks

move slow work out of transactions:

```ts
if (ctx.server) {
  ctx.server.asyncTasks.push(async () => {
    await ctx.server.actions.sendPushNotification(message)
  })
}
```

## convergence

mutations run on both client and server — they must produce the same result.

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
// optimistic — updates UI immediately
zero.mutate.post.update(post)

// wait for server confirmation
const result = await zero.mutate.post.update(post).server
```

## soft deletes

```ts
// mutation
async delete(ctx, { id }) {
  await ctx.tx.mutate.post.update({ id, deleted: true })
}

// queries filter deleted
.where('deleted', false)
```

## related skills

- `takeout-zero` — overview, anti-patterns, when to use each sub-skill
- `takeout-zero-queries` — useQuery, zql, serverWhere, pagination
- `takeout-zero-setup` — env vars, relationships config, tuning
