---
name: takeout-emitters
description: Event emitters and pub/sub pattern for ephemeral UI state management. event emitters, pub/sub, ephemeral state, temporary state, transient state, UI events, event coordination, subscribe, emit, listen, @take-out/helpers emitters.
---

# Emitters Guide - Event-Based State Management

Emitters are a lightweight event-based state management pattern used throughout
the codebase for handling ephemeral state and events. They're designed for
transient state that doesn't need persistence - think UI interactions, temporary
states, and event coordination.

Warning: Emitters should only be used for ephemeral state events. For persistent
state, use Zero queries. Overusing emitters can lead to hard-to-debug event
chains and memory leaks.

## Core Concepts

An emitter is a simple pub-sub pattern with:

- A current value
- Listeners that react to changes
- Type-safe event emissions
- Optional comparison logic to prevent unnecessary updates

## Basic Usage

```tsx
import { createEmitter, useEmitterValue, useEmitter } from '@take-out/helpers'

// simple value emitter
const counterEmitter = createEmitter('counter', 0)

// emit a new value
counterEmitter.emit(5)

// get current value directly
console.info(counterEmitter.value) // 5

// listen to changes
const unsubscribe = counterEmitter.listen((value) => {
  console.info('Counter changed:', value)
})

// clean up listener
unsubscribe()
```

## Comparison Strategies

Comparators control when listeners are notified:

- isEqualIdentity: Only emit if value !== previous (default for primitives)
- isEqualNever: Always emit, even for same values (useful for events)
- isEqualDeep: Only emit if deeply different (for objects/arrays)
- Custom: Provide your own comparison function

```tsx
import { isEqualIdentity, isEqualNever, isEqualDeep } from '@take-out/helpers'

// always emit (good for action events)
const actionEmitter = createEmitter(
  'action',
  { type: 'idle' },
  { comparator: isEqualNever },
)

// only emit if value changes (identity check)
const idEmitter = createEmitter('currentId', null as string | null, {
  comparator: isEqualIdentity,
})

// deep equality check for objects
const configEmitter = createEmitter(
  'config',
  { theme: 'dark', fontSize: 14 },
  { comparator: isEqualDeep },
)
```

## React Hooks

### useEmitterValue - Subscribe to value changes

```tsx
function MyComponent() {
  const counter = useEmitterValue(counterEmitter)
  return <div>Count: {counter}</div>
}
```

### useEmitter - React to emissions without storing value

```tsx
function ActionHandler() {
  useEmitter(actionEmitter, (action) => {
    switch (action.type) {
      case 'submit':
        handleSubmit()
        break
      case 'cancel':
        handleCancel()
        break
    }
  })
  return null
}
```

### useEmitterSelector - Derive state from emitter value

```tsx
function DerivedState() {
  const isEven = useEmitterSelector(counterEmitter, (count) => count % 2 === 0)
  return <div>Is even: {isEven}</div>
}
```

### useEmittersSelector - Combine multiple emitters

```tsx
function CombinedState() {
  const combined = useEmittersSelector(
    [counterEmitter, idEmitter] as const,
    ([count, id]) => ({ count, id }),
  )
  return (
    <div>
      Count: {combined.count}, ID: {combined.id}
    </div>
  )
}
```

## Advanced Patterns

### Type-safe action emitters with discriminated unions

```tsx
type MessageInputAction =
  | { type: 'submit'; id: string }
  | { type: 'focus' }
  | { type: 'clear' }
  | { type: 'autocomplete-user'; user: User; value: string }
  | { type: 'autocomplete-emoji'; emoji: string; value: string }

const messageInputController = createEmitter<MessageInputAction>(
  'messageInput',
  { type: 'clear' },
  { comparator: isEqualNever },
)

// usage with type safety
messageInputController.emit({ type: 'submit', id: '123' })
messageInputController.emit({
  type: 'autocomplete-user',
  user: someUser,
  value: '@john',
})
```

### Awaiting next value with promises

```tsx
async function waitForConfirmation() {
  const confirmEmitter = createEmitter('confirm', false)

  showConfirmDialog()

  const confirmed = await confirmEmitter.nextValue()

  if (confirmed) {
    performAction()
  }
}
```

### Global emitters that survive HMR

```tsx
import { createGlobalEmitter } from '@take-out/helpers'

const globalStateEmitter = createGlobalEmitter('globalState', {
  theme: 'dark',
  sidebarOpen: true,
})
```

### Contextual emitters for component trees

```tsx
import { createContextualEmitter } from '@take-out/helpers'

const [useChannelEmitter, ChannelEmitterProvider] =
  createContextualEmitter<string>('channelId', { comparator: isEqualIdentity })

// provider at parent level
function ChannelView({ channelId }) {
  return (
    <ChannelEmitterProvider value={channelId}>
      <ChannelContent />
    </ChannelEmitterProvider>
  )
}

// consumer in child components
function ChannelContent() {
  const channelEmitter = useChannelEmitter()
  const channelId = useEmitterValue(channelEmitter)
  // ...
}
```

### Silent emitters (no console output)

```tsx
const positionEmitter = createEmitter(
  'position',
  { x: 0, y: 0 },
  { silent: true },
)
```

## Real-World Examples from Codebase

### Gallery/Modal Control

Shows/hides UI elements with nullable state

```tsx
import { galleryEmitter } from '~/features/gallery/galleryEmitter'

// open gallery with items
galleryEmitter.emit({
  items: attachments,
  firstItem: attachmentId,
})

// close gallery
galleryEmitter.emit(null)

// component usage
function Gallery() {
  const galleryData = useEmitterValue(galleryEmitter)
  if (!galleryData) return null
  return <GalleryView {...galleryData} />
}
```

### Error Handling

Centralized error reporting

```tsx
import { errorEmitter } from '~/features/errors/errorEmitter'

// report error from anywhere
errorEmitter.emit({
  error: new Error('Something went wrong'),
  context: 'user-action',
  timestamp: Date.now(),
})

// global error handler
function ErrorBoundary() {
  useEmitter(errorEmitter, (errorReport) => {
    if (errorReport) {
      logToSentry(errorReport)
      showErrorToast(errorReport.error.message)
    }
  })
}
```

### Autocomplete System

Complex stateful interactions

```tsx
import { autocompleteEmitter } from '~/features/autocomplete/autocompleteEmitter'

type AutocompleteEvent =
  | { type: 'open'; query: string; position: DOMRect }
  | { type: 'close' }
  | { type: 'select'; item: AutocompleteItem }

// trigger autocomplete
autocompleteEmitter.emit({
  type: 'open',
  query: '@use',
  position: inputElement.getBoundingClientRect(),
})
```

### Message Highlighting

Temporary UI states

```tsx
import { messageItemEmitter } from '~/features/message/messageItemEmitter'

// highlight a message temporarily
messageItemEmitter.emit({ type: 'highlight', id: messageId })

// in message component
function MessageItem({ message }) {
  const [isHighlighted, setIsHighlighted] = useState(false)

  useEmitter(messageItemEmitter, (event) => {
    if (event.type === 'highlight' && event.id === message.id) {
      setIsHighlighted(true)
      setTimeout(() => setIsHighlighted(false), 1000)
    }
  })

  return <div className={isHighlighted ? 'highlight' : ''}>{message.text}</div>
}
```

### Toast/Notification Queue

Event-driven notifications

```tsx
const notificationEmitter = createEmitter<
  | { type: 'show'; notification: Notification }
  | { type: 'hide'; id: string }
  | { type: 'hide_all' }
>('notifications', { type: 'hide_all' })

// show notification
notificationEmitter.emit({
  type: 'show',
  notification: {
    id: Date.now().toString(),
    title: 'New message',
    body: 'You have a new message from John',
  },
})
```

### Dialog Management

Coordinating async UI flows

```tsx
import { confirmEmitter, dialogEmit } from '~/interface/dialogs/actions'

async function deleteMessage(messageId: string) {
  dialogEmit({
    type: 'confirm',
    title: 'Delete Message?',
    description: 'This action cannot be undone.',
  })

  const confirmed = await confirmEmitter.nextValue()

  if (confirmed) {
    await api.deleteMessage(messageId)
  }
}
```

### Server Tint Color

Propagating theme changes

```tsx
import { serverTintEmitter } from '~/features/server/serverTintEmitter'

// provider updates tint when server changes
function ServerTintProvider() {
  const { server } = useCurrentServer()

  useLayoutEffect(() => {
    serverTintEmitter.emit(server?.tint || 0)
  }, [server?.tint])

  return null
}

// consumer components react to tint changes
function ThemedButton() {
  const tint = useEmitterValue(serverTintEmitter)
  const color = tint > 0 ? colors[tint] : 'default'
  return <Button color={color} />
}
```

## Best Practices

DO:

- Use for ephemeral UI state (modals, tooltips, highlights)
- Use for event coordination between distant components
- Use for temporary user interactions
- Use for one-time events and notifications
- Clean up listeners in useEffect/useLayoutEffect
- Use appropriate comparators for your data type
- Name emitters clearly and consistently

DON'T:

- Use for persistent application state (use Zero/Jotai instead)
- Use for data that needs to survive page refreshes
- Create complex chains of emitters triggering each other
- Forget to unsubscribe listeners (memory leaks)
- Use for frequently changing values like scroll position without throttling
- Store large objects that could be in proper state management
- Use when simple React state or props would suffice

## Debugging

Emitters support debug logging when DEBUG_LEVEL > 1:

1. Set DEBUG_LEVEL in environment/devtools
2. Non-silent emitters will log emissions with stack traces
3. Use browser DevTools to filter by emitter name

Example console output:

```
📣 messageInput
  { type: 'submit', id: '123' }
  trace > [stack trace]
```

## Memory Management

### Preventing memory leaks:

```tsx
// bad: listener never cleaned up
function LeakyComponent() {
  useEffect(() => {
    myEmitter.listen((value) => {
      doSomething(value)
    })
  }, [])
}

// good: proper cleanup
function CleanComponent() {
  useEffect(() => {
    const unsubscribe = myEmitter.listen((value) => {
      doSomething(value)
    })
    return unsubscribe
  }, [])
}

// better: use the hook (handles cleanup automatically)
function BestComponent() {
  useEmitter(myEmitter, (value) => {
    doSomething(value)
  })
}
```

## Testing

Emitters are easy to test:

```tsx
import { describe, it, expect, vi } from 'vitest'

describe('Emitter Testing', () => {
  it('should emit values to listeners', () => {
    const emitter = createEmitter('test', 0)
    const listener = vi.fn()

    const unsubscribe = emitter.listen(listener)
    emitter.emit(5)

    expect(listener).toHaveBeenCalledWith(5)
    expect(emitter.value).toBe(5)

    unsubscribe()
  })

  it('should handle async nextValue', async () => {
    const emitter = createEmitter('async', false)

    setTimeout(() => emitter.emit(true), 100)

    const value = await emitter.nextValue()
    expect(value).toBe(true)
  })
})
```

## Common Pitfalls & Solutions

### Infinite loops with emitters in effects

```tsx
// bad: creates infinite loop
function InfiniteLoop() {
  useEmitter(emitterA, (value) => {
    emitterB.emit(value)
  })
}

// good: break circular dependencies
function SafeEmission() {
  useEmitter(emitterA, (value) => {
    if (shouldUpdate(value)) {
      emitterB.emit(transform(value))
    }
  })
}
```

### Using emitters for computed values

```tsx
// bad: unnecessary emitter for derived state
const doubledEmitter = createEmitter('doubled', 0)
useEmitter(counterEmitter, (count) => {
  doubledEmitter.emit(count * 2)
})

// good: use selector for derived values
const doubled = useEmitterSelector(counterEmitter, (count) => count * 2)
```

### Forgetting type safety

```tsx
// bad: loose typing
const emitter = createEmitter('data', {} as any)

// good: proper typing
type DataState = {
  user: User | null
  loading: boolean
  error: Error | null
}
const emitter = createEmitter<DataState>('data', {
  user: null,
  loading: false,
  error: null,
})
```

## Summary

Emitters are powerful for ephemeral UI state, event coordination, decoupled
communication, and temporary interactions.

But remember:

- They're not for persistent state
- Always clean up listeners
- Use appropriate comparators
- Don't overuse them

When in doubt, ask yourself:

- "Does this state need to persist?" → Use Zero/Jotai
- "Is this a temporary UI event?" → Use an emitter
- "Can I use simple React state?" → Use useState
