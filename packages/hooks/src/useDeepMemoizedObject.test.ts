import { describe, expect, it } from 'vitest'

import { deepMemoize, type Options } from './useDeepMemoizedObject'

function testMemoization<T>(
  initialValue: T,
  options?: Options
): { current: T; update: (value: T) => void } {
  let previousValue = initialValue

  return {
    get current() {
      return previousValue
    },
    update(value: T) {
      previousValue = deepMemoize(
        value,
        previousValue,
        [],
        options?.immutableToNestedChanges
      )
    },
  }
}

describe('useDeepMemoizedObject', () => {
  it('should preserve identity for unchanged primitives', () => {
    const hook = testMemoization(42)
    const firstResult = hook.current
    hook.update(42)
    expect(hook.current).toBe(firstResult)
  })

  it('should preserve identity for unchanged objects', () => {
    const obj = { a: 1, b: 2 }
    const hook = testMemoization(obj)
    const firstResult = hook.current
    hook.update({ a: 1, b: 2 })
    expect(hook.current).toBe(firstResult)
  })

  it('should preserve identity for unchanged arrays', () => {
    const arr = [1, 2, 3]
    const hook = testMemoization(arr)
    const firstResult = hook.current
    hook.update([1, 2, 3])
    expect(hook.current).toBe(firstResult)
  })

  it('should handle nested object changes correctly', () => {
    const initial = {
      server: {
        id: 1,
        channels: [
          { id: 1, name: 'general' },
          { id: 2, name: 'random' },
          { id: 3, name: 'tech' },
        ],
      },
    }

    const hook = testMemoization(initial)
    const firstResult = hook.current

    const updated = {
      server: {
        id: 1,
        channels: [
          { id: 1, name: 'general-updated' },
          { id: 2, name: 'random' },
          { id: 3, name: 'tech' },
        ],
      },
    }

    hook.update(updated)
    const secondResult = hook.current

    expect(secondResult).not.toBe(firstResult)
    expect(secondResult.server).not.toBe(firstResult.server)
    expect(secondResult.server.channels).not.toBe(firstResult.server.channels)
    expect(secondResult.server.channels[0]).not.toBe(firstResult.server.channels[0])
    expect(secondResult.server.channels[1]).toBe(firstResult.server.channels[1])
    expect(secondResult.server.channels[2]).toBe(firstResult.server.channels[2])
  })

  it('should handle deep nested changes in arrays', () => {
    const initial = {
      server: {
        channels: [
          {
            id: 1,
            messages: [
              { id: 1, text: 'hi' },
              { id: 2, text: 'hello' },
              {
                id: 3,
                text: 'world',
                reactions: [
                  { emoji: '👍', count: 1 },
                  { emoji: '❤️', count: 2 },
                  { emoji: '😂', count: 3, updatedAt: '2024-01-01' },
                  { emoji: '🎉', count: 4 },
                ],
              },
            ],
          },
        ],
      },
    }

    const hook = testMemoization(initial)
    const firstResult = hook.current

    const updated = JSON.parse(JSON.stringify(initial))
    updated.server.channels[0].messages[2].reactions[2].updatedAt = '2024-01-02'

    hook.update(updated)
    const secondResult = hook.current

    expect(secondResult).not.toBe(firstResult)
    expect(secondResult.server).not.toBe(firstResult.server)
    expect(secondResult.server.channels).not.toBe(firstResult.server.channels)
    expect(secondResult.server.channels[0]).not.toBe(firstResult.server.channels[0])
    expect(secondResult.server.channels[0]!.messages).not.toBe(
      firstResult.server.channels[0]!.messages
    )

    expect(secondResult.server.channels[0]!.messages[0]).toBe(
      firstResult.server.channels[0]!.messages[0]
    )
    expect(secondResult.server.channels[0]!.messages[1]).toBe(
      firstResult.server.channels[0]!.messages[1]
    )
    expect(secondResult.server.channels[0]!.messages[2]).not.toBe(
      firstResult.server.channels[0]!.messages[2]
    )

    expect(secondResult.server.channels[0]!.messages[2]!.reactions).not.toBe(
      firstResult.server.channels[0]!.messages[2]!.reactions
    )
    expect(secondResult.server.channels[0]!.messages[2]!.reactions![0]).toBe(
      firstResult.server.channels[0]!.messages[2]!.reactions![0]
    )
    expect(secondResult.server.channels[0]!.messages[2]!.reactions![1]).toBe(
      firstResult.server.channels[0]!.messages[2]!.reactions![1]
    )
    expect(secondResult.server.channels[0]!.messages[2]!.reactions![2]).not.toBe(
      firstResult.server.channels[0]!.messages[2]!.reactions![2]
    )
    expect(secondResult.server.channels[0]!.messages[2]!.reactions![3]).toBe(
      firstResult.server.channels[0]!.messages[2]!.reactions![3]
    )
  })

  it('should respect immutableToNestedChanges option', () => {
    const initial = {
      server: {
        id: 1,
        channels: [
          {
            id: 1,
            messages: [
              { id: 1, text: 'hi' },
              { id: 2, text: 'hello' },
              { id: 3, text: 'world' },
              { id: 4, text: 'foo' },
              { id: 5, text: 'bar' },
              {
                id: 6,
                text: 'baz',
                reactions: [
                  { emoji: '👍', count: 1 },
                  { emoji: '❤️', count: 2 },
                  { emoji: '😂', count: 3, updatedAt: '2024-01-01' },
                ],
              },
            ],
          },
        ],
      },
    }

    const hook = testMemoization(initial, {
      immutableToNestedChanges: {
        server: true,
        'server.channels.0': true,
      },
    })

    const firstResult = hook.current
    // Save original references before mutation
    const originalChannels = firstResult.server.channels
    const originalChannel0 = firstResult.server.channels[0]
    const originalMessages = firstResult.server.channels[0]!.messages
    const originalMessage5 = firstResult.server.channels[0]!.messages[5]
    const originalReactions = firstResult.server.channels[0]!.messages[5]!.reactions

    const updated = JSON.parse(JSON.stringify(initial))
    updated.server.channels[0].messages[5].reactions[2].updatedAt = '2024-01-02'

    hook.update(updated)
    const secondResult = hook.current

    expect(secondResult).not.toBe(firstResult)
    // server object should be the same reference
    expect(secondResult.server).toBe(firstResult.server)
    // channels array should be different (new array)
    expect(secondResult.server.channels).not.toBe(originalChannels)
    // channels[0] should be the same (marked as immutable)
    expect(secondResult.server.channels[0]).toBe(originalChannel0)
    // But its messages array should be different
    expect(secondResult.server.channels[0]!.messages).not.toBe(originalMessages)
    expect(secondResult.server.channels[0]!.messages[5]).not.toBe(originalMessage5)
    expect(secondResult.server.channels[0]!.messages[5]!.reactions).not.toBe(
      originalReactions
    )
    // Verify the actual change was applied
    expect(secondResult.server.channels[0]!.messages[5]!.reactions![2]!.updatedAt).toBe(
      '2024-01-02'
    )
  })

  it('should handle adding new properties to objects', () => {
    const initial = { a: 1, b: 2 }
    const hook = testMemoization(initial)
    const firstResult = hook.current
    const updated = { a: 1, b: 2, c: 3 }

    hook.update(updated)
    expect(hook.current).not.toBe(firstResult)
    expect(hook.current).toEqual(updated)
  })

  it('should handle array length changes', () => {
    const initial = [1, 2, 3]
    const hook = testMemoization(initial)
    const firstResult = hook.current
    hook.update([1, 2, 3, 4])
    expect(hook.current).not.toBe(firstResult)
    expect(hook.current).toEqual([1, 2, 3, 4])
  })

  it('should handle null and undefined values', () => {
    const nullHook = testMemoization(null as any)
    expect(nullHook.current).toBe(null)

    nullHook.update(undefined as any)
    expect(nullHook.current).toBe(undefined)

    nullHook.update({ a: null, b: undefined })
    const objResult = nullHook.current as any
    expect(objResult.a).toBe(null)
    expect(objResult.b).toBe(undefined)
  })

  it('should preserve array items when only one changes', () => {
    const initial = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]

    const hook = testMemoization(initial)
    const firstResult = hook.current

    const updated = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bobby' },
      { id: 3, name: 'Charlie' },
    ]

    hook.update(updated)
    const secondResult = hook.current

    expect(secondResult).not.toBe(firstResult)
    expect(secondResult[0]).toBe(firstResult[0])
    expect(secondResult[1]).not.toBe(firstResult[1])
    expect(secondResult[2]).toBe(firstResult[2])
  })

  it('should handle complex immutableToNestedChanges patterns', () => {
    const initial = {
      app: {
        settings: {
          theme: 'dark',
          language: 'en',
          nested: {
            deep: {
              value: 1,
            },
          },
        },
      },
    }

    const hook = testMemoization(initial, {
      immutableToNestedChanges: {
        'app.settings': true,
      },
    })

    const firstResult = hook.current
    const originalSettings = firstResult.app.settings
    const originalNested = firstResult.app.settings.nested
    const originalDeep = firstResult.app.settings.nested.deep

    const updated = JSON.parse(JSON.stringify(initial))
    updated.app.settings.nested.deep.value = 2

    hook.update(updated)
    const secondResult = hook.current

    expect(secondResult).not.toBe(firstResult)
    expect(secondResult.app).not.toBe(firstResult.app)
    // settings should be the same (marked as immutable)
    expect(secondResult.app.settings).toBe(originalSettings)
    // These should also be the same since settings is immutable and contains them
    expect(secondResult.app.settings.nested).toBe(originalNested)
    expect(secondResult.app.settings.nested.deep).toBe(originalDeep)
    // But the value should have been mutated
    expect(secondResult.app.settings.nested.deep.value).toBe(2)
  })

  it('should handle mixed arrays with objects and primitives', () => {
    const initial = [1, 'string', { id: 1, name: 'object' }, [1, 2, 3], null, undefined]

    const hook = testMemoization(initial)
    const firstResult = hook.current

    const updated = [1, 'string', { id: 1, name: 'updated' }, [1, 2, 3], null, undefined]

    hook.update(updated)
    const secondResult = hook.current

    expect(secondResult).not.toBe(firstResult)
    expect(secondResult[0]).toBe(1)
    expect(secondResult[1]).toBe('string')
    expect(secondResult[2]).not.toBe(firstResult[2])
    expect(secondResult[3]).toBe(firstResult[3])
    expect(secondResult[4]).toBe(null)
    expect(secondResult[5]).toBe(undefined)
  })
})
