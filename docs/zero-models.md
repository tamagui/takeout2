---
name: takeout-zero-models
description: Zero models, mutations, CRUD — namespace folders, permissions, MutatorContext, optimistic updates, soft deletes.
---

## models

each namespace is a folder under `src/data/`, holding `mutations.ts` and
optionally `queries.ts`. the folder name is the namespace name. mutations
define permissions and the mutators:

```ts
// src/data/post/mutations.ts
import { mutations, serverWhere } from 'on-zero'

import type { Post } from '../types'

const permissions = serverWhere('post', (q, auth) => {
  return q.cmp('userId', auth?.id || '')
})

export const mutate = mutations('post', permissions, {
  insert: async ({ tx, server, authData }, post: Post) => {
    await tx.mutate.post.insert(post)

    if (server) {
      server.enqueueTask(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'post_created')
      )
    }
  },
})
```

the table name string resolves against the generated schema, which is derived
from `src/database/schema.ts` via drizzle-zero - do not redeclare columns here.
run `bun zero:generate` after a structural schema change.

a flat `src/data/mutations/` or `src/data/models/` directory is not a valid
layout; `on-zero generate` rejects it.

passing a table name and `permissions` to `mutations()` generates CRUD:

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
    enqueueTask(task: AsyncTask, opts?: { barrier?: boolean }): void
  }
}
```

## async tasks

move slow work out of transactions:

```ts
if (ctx.server) {
  ctx.server.enqueueTask(async () => {
    await ctx.server.actions.sendPushNotification(message)
  })
}
```

Tasks run in the background after commit by default. Pass `{ barrier: true }`
only when the client must wait for the effect before issuing its next writes.

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
