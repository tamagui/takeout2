// @vitest-environment jsdom
import { createEmitter } from '@take-out/helpers'
import { UpdateNeededReasonType } from '@rocicorp/zero'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  composeRecoveryLogSink,
  makeZeroRecovery,
  resetRecoveryStateForTests,
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

// recovery chains deletes -> beforeReload -> reload across several microtasks;
// a macrotask boundary drains the whole chain deterministically.
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  window.sessionStorage.clear()
  resetRecoveryStateForTests()
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
    resetRecoveryStateForTests()
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

  test('combined client: every instance deletes its own store, but only ONE reload', async () => {
    // two instances (control + project) fail on the same page-load. each must
    // drop its OWN store; only one page reload should fire.
    const a = setup()
    const b = setup()
    makeZeroRecovery(a.deps).onClientStateNotFound()
    makeZeroRecovery(b.deps).onClientStateNotFound()
    await flush()
    expect(a.deleteLocalState).toHaveBeenCalledTimes(1)
    expect(b.deleteLocalState).toHaveBeenCalledTimes(1)
    expect(a.reload.mock.calls.length + b.reload.mock.calls.length).toBe(1)
  })

  test('a second trigger in the same page-load adds no extra reload or fatal', async () => {
    const { deps, reload, events } = setup()
    const recovery = makeZeroRecovery(deps)
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
    resetRecoveryStateForTests() // simulate the page reload clearing in-memory state
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
    resetRecoveryStateForTests()
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

  test('logSink flush calls through the consumer sink (preserves its this)', async () => {
    const { deps } = setup()
    class ClassSink {
      flushed = false
      log(): void {}
      flush(): Promise<void> {
        this.flushed = true
        return Promise.resolve()
      }
    }
    const consumer = new ClassSink()
    const sink = composeRecoveryLogSink(deps, consumer)
    await sink.flush?.()
    expect(consumer.flushed).toBe(true)
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

  // a host with a `window` shim but no real `location` — the sootsim tenant
  // render-worker, which hides `location` for isolation. the DEFAULT reload
  // path (no injected `deps.reload`) must still drop stale IDB and not throw
  // "reading 'reload'" on undefined; it no-ops the reload and lets the host
  // remount. previously crashed as an unhandled rejection.
  test('default reload path is a safe no-op when location is absent', async () => {
    const events: ZeroEvent[] = []
    const zeroEvents = createEmitter<ZeroEvent | null>(`test-recover-${emitterSeq++}`, null)
    zeroEvents.listen((event) => {
      if (event) events.push(event)
    })
    const deleteLocalState = vi.fn(() => Promise.resolve())
    // no `reload` dep — exercises the default `globalThis.location?.reload?.()`.
    const deps: ZeroRecoveryDeps = { deleteLocalState, zeroEvents }
    const originalLocation = globalThis.location
    // simulate the worker: window exists (jsdom) but location is absent.
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: undefined,
    })
    try {
      makeZeroRecovery(deps).onClientStateNotFound()
      await flush()
    } finally {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      })
    }
    expect(deleteLocalState).toHaveBeenCalledTimes(1)
    expect(events).toContainEqual({ type: 'recovering', reason: 'client state not found' })
  })
})
