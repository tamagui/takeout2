# Zero Mutations Implementation Guide

This guide provides a comprehensive overview of how custom mutations are
implemented in this Zero-based application, including our custom CRUD permission
system, context management, and architectural patterns.

## Overview

Zero provides [custom mutators](https://zero.rocicorp.dev/docs/custom-mutators)
as a way to implement server-side business logic. This codebase extends Zero's
mutator system with:

- Declarative permission system - Define read/write permissions alongside
  schemas
- Context-aware execution using AsyncLocalStorage
- Server-side actions for external integrations
- Automatic CRUD mutations with permission enforcement

## Core Architecture

### File Structure

```
src/data/
├── models/              # table schemas, permissions, and mutations
│   ├── message.ts       # example: message table with custom mutations
│   ├── user.ts          # example: user table with permissions
│   └── helpers/         # shared mutation helpers
├── helpers/
│   ├── builder.ts       # permission query builder
│   └── mutations.ts     # mutation factory with CRUD generation
├── permissions/         # reusable permission helpers
│   ├── channel.ts       # channel-specific permissions
│   └── server.ts        # server-specific permissions
└── context.ts           # context management
```

### Entry Points

- Zero: `/src/zero/zero.ts` - Creates Zero instance with mutators
- Server: `/app/api/zero/push+api.tsx` - Handles server-side mutation processing

## Defining Models with Permissions

Models are defined in `src/data/models/` with three key exports:

### 1. Schema Definition

```typescript
import { boolean, number, string, table } from '@rocicorp/zero'

export const schema = table('message')
  .columns({
    id: string(),
    content: string(),
    creatorId: string(),
    channelId: string(),
    deleted: boolean(),
    createdAt: number(),
  })
  .primaryKey('id')
```

### 2. Permission Rules

Permissions use a query builder pattern to define read/write access:

```typescript
import { builder } from '~/data/helpers/builder'
import { ensureLoggedIn } from '~/data/permissions/helpers/ensureLoggedIn'

export const permissions = builder('message', (eb, ctx) => {
  const authData = ensureLoggedIn()

  const isCreator = eb.cmp('creatorId', authData.id)
  const isChannelMember = eb.exists('channel', (q) =>
    q.whereExists('member', (q) => q.where('id', authData.id)),
  )

  return {
    read: isChannelMember,
    write: eb.and(isCreator, isChannelMember),
  }
})
```

### 3. Mutations

The `mutations` helper automatically generates CRUD operations and allows custom
mutations:

```typescript
import { mutations } from '~/data/helpers/mutations'

export const mutate = mutations(schema, permissions, {
  // custom mutations (optional)
  send: async (
    { tx, authData, environment, serverActions },
    message: SendMessage,
  ) => {
    ensure(authData)

    await tx.mutate.message.update(message)

    if (environment === 'server') {
      await serverActions?.indexMessage(message)
    }
  },

  // delete_ convention for delete mutations (Zero reserved word)
  delete_: async ({ tx }, messageId: string) => {
    await tx.mutate.message.update({
      id: messageId,
      deleted: true,
    })
  },
})
```

## Context Management

### The MutatorContext

Context is passed as the first argument to all custom mutations:

```typescript
export type MutatorContext = {
  tx: TX // transaction with permission checks
  rawTx: TX // raw transaction (bypasses permissions)
  authData: AuthData | null // current user authentication
  environment: 'server' | 'client'
  serverActions?: ServerActions // server-side integrations
  asyncTasks?: Array<() => Promise<void>> // deferred tasks
  allowed: (permissions, action, data) => Promise<void> // permission checker
}
```

### Using Context in Mutations

```typescript
export const mutate = mutations(schema, permissions, {
  insert: async (context, message: Message) => {
    const { tx, authData, environment, serverActions, allowed } = context

    // check permissions explicitly if needed
    await allowed(permissions, 'write', message)

    // use tx for mutations with permission checks
    await tx.mutate.message.insert(message)

    // use rawTx to bypass permissions (system operations)
    await context.rawTx.mutate.systemLog.insert({ ... })

    // server-only operations
    if (environment === 'server') {
      await serverActions?.searchActions.indexMessage(message)
    }
  }
})
```

## Custom Mutators

### When to Define Custom Mutators

Custom mutators are only needed when:

1. You need custom logic before/after a mutation
2. You need to trigger side effects (notifications, search indexing)
3. You need to update denormalized fields
4. You need to validate business rules beyond permissions
5. You need to coordinate multiple mutations

If you just need basic CRUD with permissions, the `mutations` helper
automatically provides insert, update, upsert, and delete.

### Convergence Requirement

Critical: Custom mutators run on both client and server, and they must converge
to the same result:

```typescript
// bad - non-convergent mutator
export const mutate = mutations(schema, permissions, {
  insert: async ({ tx }, data: Data) => {
    await tx.mutate.record.insert({
      ...data,
      id: Math.random().toString(), // different on each execution
      timestamp: Date.now(), // different timing
    })
  },
})

// good - convergent mutator
export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, environment, serverActions }, data: Data) => {
    // use values passed in, generated once on the client
    await tx.mutate.record.insert(data)

    // server-only side effects don't affect convergence
    if (environment === 'server') {
      await serverActions?.sendNotification(data.id)
    }
  },
})
```

## Server vs Client Execution

### Understanding Execution Flow

1. Client-side: Mutation runs optimistically for instant UI updates
2. Server-side: Mutation re-runs with server context for validation and side
   effects
3. Convergence: Both executions must produce the same data state

### Server-Only Operations

Use the `environment` check for operations that should only run server-side:

```typescript
export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, environment, serverActions }, message: Message) => {
    // this runs on both client and server
    await tx.mutate.message.insert(message)

    // this only runs on the server
    if (environment === 'server') {
      await serverActions?.emailActions.sendNewMessageEmail(message)
      await serverActions?.searchActions.indexMessage(message)

      const summary = await serverActions?.aiActions.summarize(message.content)
      await tx.mutate.message.update({ id: message.id, summary })
    }
  },
})
```

## The delete\_ Convention

Since `delete` is a reserved word in JavaScript, use `delete_` for delete
mutations:

```typescript
export const mutate = mutations(schema, permissions, {
  delete_: async (
    { tx },
    primaryKey: { messageId: string; userId: string },
  ) => {
    await tx.mutate.userMessage.delete(primaryKey)
  },
})
```

## Examples

### Basic Model with Permissions

```typescript
// src/data/models/comment.ts
import { string, number, table } from '@rocicorp/zero'
import { builder } from '~/data/helpers/builder'
import { mutations } from '~/data/helpers/mutations'

export const schema = table('comment')
  .columns({
    id: string(),
    postId: string(),
    authorId: string(),
    content: string(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = builder('comment', (eb, ctx) => {
  const userId = ctx.authData?.id || ''

  return {
    read: eb.exists('post', (q) => q.where('published', true)),
    write: eb.cmp('authorId', userId),
  }
})

// automatically provides insert, update, upsert, delete with permissions
export const mutate = mutations(schema, permissions, {})
```

### Model with Custom Mutations

```typescript
// src/data/models/friendship.ts
export const mutate = mutations(schema, permissions, {
  update: async ({ tx, authData }, friendship: Friendship) => {
    if (authData?.id && friendship.accepted === true) {
      await createPrivateServer(
        tx,
        friendship.requestingId,
        friendship.acceptingId,
        authData.id,
        friendship.createdAt,
      )
    }

    await tx.mutate.friendship.update(friendship)
  },

  insert: async ({ tx }, friendship: Friendship) => {
    await tx.mutate.friendship.insert(friendship)

    await tx.mutate.notification.insert({
      id: randomId(),
      type: 'friendship',
      createdAt: Date.now(),
      fromUserId: friendship.requestingId,
      userId: friendship.acceptingId,
      seenAt: null,
    })
  },
})
```

### Using the `allowed` Helper

```typescript
export const mutate = mutations(schema, permissions, {
  save: async ({ tx, allowed }, message: MessageUpdate) => {
    // explicitly check permissions before mutation
    await allowed(permissions, 'write', message)

    if (message.deleted) {
      await tx.mutate.message.update(message)
      return
    }

    await tx.mutate.message.update(message)
  },
})
```

## Best Practices

1. Keep mutations convergent - Avoid non-deterministic values in mutations
2. Use context destructuring - Extract only the context properties you need
3. Server-side for side effects - Email, search indexing, AI operations
4. Explicit permission checks - Use `allowed` when you need fine-grained control
5. Reuse permission helpers - Create shared permission functions in
   `src/data/permissions/`
6. Type your mutations - Always type mutation parameters for better DX
