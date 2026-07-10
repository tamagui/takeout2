import { afterEach, describe, expect, test, vi } from 'vitest'

import { createMutators } from './createMutators'

afterEach(() => {
  vi.useRealTimers()
})

describe('createMutators timeout guard', () => {
  test('releases the timeout when a mutation succeeds', async () => {
    vi.useFakeTimers()
    const mutators = createMutators({
      environment: 'server',
      authData: null,
      can: {} as never,
      models: {
        task: {
          mutate: {
            create: async () => {},
          },
        },
      } as never,
    }) as any

    await mutators.task.create({}, {})

    expect(vi.getTimerCount()).toBe(0)
  })

  test('releases the timeout when a mutation fails', async () => {
    vi.useFakeTimers()
    const mutators = createMutators({
      environment: 'server',
      authData: null,
      can: {} as never,
      models: {
        task: {
          mutate: {
            create: async () => {
              throw new Error('nope')
            },
          },
        },
      } as never,
    }) as any

    await expect(mutators.task.create({}, {})).rejects.toThrow('nope')

    expect(vi.getTimerCount()).toBe(0)
  })
})
