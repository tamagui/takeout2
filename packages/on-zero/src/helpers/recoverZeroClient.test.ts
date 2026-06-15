// @vitest-environment jsdom
import { createEmitter } from '@take-out/helpers'
import { UpdateNeededReasonType } from '@rocicorp/zero'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { composeRecoveryLogSink, makeZeroRecovery } from './recoverZeroClient'

import type { ZeroRecoveryDeps } from './recoverZeroClient'
import type { ZeroEvent } from '../types'

let emitterSeq = 0

function setup() {
  const events: ZeroEvent[] = []
  const zeroEvents = createEmitter<ZeroEvent | null>(`test-recover-${emitterSeq++}`, null)
  zeroEvents.listen((event) => {
    if (event) events.push(event)
  })
  const deleteLocalState = vi.fn(() => Promise.resolve())
  const reload = vi.fn()
  const deps: ZeroRecoveryDeps = { deleteLocalState, zeroEvents, reload }
  return { deps, deleteLocalState, reload, events }
}

// recovery chains deleteLocalState -> beforeReload -> reload across several
// microtasks; a macrotask boundary drains the whole chain deterministically.
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  window.sessionStorage.clear()
})

describe('zero recovery', () => {
  test('onUpdateNeeded drops local state and reloads, emitting recovering', async () => {
    const { deps, deleteLocalState, reload, events } = setup()
    makeZeroRecovery(deps).onUpdateNeeded({
      type: UpdateNeededReasonType.SchemaVersionNotSupported,
    })
    expect(events).toEqual([
      {
        type: 'recovering',
        reason: expect.stringContaining('SchemaVersionNotSupported'),
      },
    ])
    await flush()
    expect(deleteLocalState).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('onClientStateNotFound recovers the same way', async () => {
    const { deps, deleteLocalState, reload } = setup()
    makeZeroRecovery(deps).onClientStateNotFound()
    await flush()
    expect(deleteLocalState).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('loop guard: same reason within the window emits fatal, does not reload twice', async () => {
    const { deps, reload, events } = setup()
    const recovery = makeZeroRecovery(deps)
    recovery.onUpdateNeeded({ type: UpdateNeededReasonType.NewClientGroup })
    await flush()
    recovery.onUpdateNeeded({ type: UpdateNeededReasonType.NewClientGroup })
    await flush()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(events.some((event) => event.type === 'fatal')).toBe(true)
  })

  test('per-reason guard: a different reason still recovers', async () => {
    const { deps, reload } = setup()
    const recovery = makeZeroRecovery(deps)
    recovery.onUpdateNeeded({ type: UpdateNeededReasonType.NewClientGroup })
    await flush()
    recovery.onUpdateNeeded({ type: UpdateNeededReasonType.SchemaVersionNotSupported })
    await flush()
    expect(reload).toHaveBeenCalledTimes(2)
  })

  test('logSink recovers on local-store-lost and forwards to the consumer sink', async () => {
    const { deps, deleteLocalState, reload } = setup()
    const consumer = { log: vi.fn() }
    const sink = composeRecoveryLogSink(deps, consumer)
    sink.log('error', undefined, 'Error during persist: Expected IndexedDB not found')
    expect(consumer.log).toHaveBeenCalledTimes(1)
    await flush()
    expect(deleteLocalState).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('logSink ignores non-error level and non-matching messages', async () => {
    const { deps, deleteLocalState, reload } = setup()
    const sink = composeRecoveryLogSink(deps)
    sink.log('info', undefined, 'Expected IndexedDB not found')
    sink.log('error', undefined, 'some unrelated error')
    await flush()
    expect(deleteLocalState).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})
