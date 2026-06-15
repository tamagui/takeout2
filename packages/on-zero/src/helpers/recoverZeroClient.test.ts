// @vitest-environment jsdom
import { createEmitter } from '@take-out/helpers'
import { UpdateNeededReasonType } from '@rocicorp/zero'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  composeRecoveryLogSink,
  makeZeroRecovery,
  resetReloadLatchForTests,
} from './recoverZeroClient'

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
  resetReloadLatchForTests()
})

describe('zero recovery', () => {
  test('SchemaVersionNotSupported drops local state and reloads, emitting recovering', async () => {
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

  test('NewClientGroup / VersionNotSupported reload WITHOUT deleting (sibling-tab safe)', async () => {
    const { deps, deleteLocalState, reload } = setup()
    const recovery = makeZeroRecovery(deps)
    recovery.onUpdateNeeded({ type: UpdateNeededReasonType.NewClientGroup })
    await flush()
    resetReloadLatchForTests()
    recovery.onUpdateNeeded({ type: UpdateNeededReasonType.VersionNotSupported })
    await flush()
    expect(deleteLocalState).not.toHaveBeenCalled()
    expect(reload).toHaveBeenCalledTimes(2)
  })

  test('onClientStateNotFound drops local state and reloads', async () => {
    const { deps, deleteLocalState, reload } = setup()
    makeZeroRecovery(deps).onClientStateNotFound()
    await flush()
    expect(deleteLocalState).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('a second trigger in the same page-load is a no-op (one reload heals all)', async () => {
    const { deps, reload, events } = setup()
    const recovery = makeZeroRecovery(deps)
    // mirrors a combined control+project client: several triggers, one reload.
    recovery.onClientStateNotFound()
    recovery.onClientStateNotFound()
    recovery.onUpdateNeeded({ type: UpdateNeededReasonType.NewClientGroup })
    await flush()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(events.filter((event) => event.type === 'fatal')).toEqual([])
  })

  test('after a reload, a re-failing reason emits fatal instead of reloading again', async () => {
    const { deps, reload, events } = setup()
    const recovery = makeZeroRecovery(deps)
    recovery.onClientStateNotFound()
    await flush()
    resetReloadLatchForTests() // simulate the page reload clearing the latch
    recovery.onClientStateNotFound()
    await flush()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(events.some((event) => event.type === 'fatal')).toBe(true)
  })

  test('after a reload, a different reason still recovers', async () => {
    const { deps, reload } = setup()
    const recovery = makeZeroRecovery(deps)
    recovery.onClientStateNotFound()
    await flush()
    resetReloadLatchForTests()
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

  test('logSink with no consumer preserves console output and still watches', async () => {
    const { deps, deleteLocalState, reload } = setup()
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const sink = composeRecoveryLogSink(deps)
    sink.log('info', { worker: 'sync' }, 'connected')
    expect(infoSpy).toHaveBeenCalledWith('worker=sync', 'connected')
    infoSpy.mockRestore()
    sink.log('error', undefined, 'Expected IndexedDB not found')
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
