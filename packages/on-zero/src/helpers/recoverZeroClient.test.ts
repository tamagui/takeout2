// @vitest-environment jsdom
import { createEmitter } from '@take-out/helpers'
import { UpdateNeededReasonType } from '@rocicorp/zero'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  classifyZeroRecoveryLog,
  composeRecoveryLogSink,
  isRecoverableZeroStalePokeMessage,
  makeZeroRecovery,
  resetRecoveryStateForTests,
} from './recoverZeroClient'

import type { ScheduleReloadContext, ZeroRecoveryDeps } from './recoverZeroClient'
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

  test('logSink recovers on native sqlite finalized-statement local-store loss', async () => {
    const { deps, deleteLocalState, reload } = setup()
    const sqliteError = new Error('This statement has been finalized')
    sqliteError.name = 'SqliteError'
    const sink = composeRecoveryLogSink(deps)
    sink.log('error', { bgIntervalProcess: 'Heartbeat' }, 'Error running.', sqliteError)
    await flush()
    expect(deleteLocalState).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('logSink recovers on repeated store-closed local-store loss', async () => {
    const nowSpy = vi.spyOn(Date, 'now')
    const { deps, deleteLocalState, reload } = setup()
    try {
      const sink = composeRecoveryLogSink(deps)
      nowSpy.mockReturnValue(10_000)
      sink.log('error', undefined, 'Failed to connect.', new Error('Store is closed'))
      await flush()
      expect(deleteLocalState).not.toHaveBeenCalled()
      expect(reload).not.toHaveBeenCalled()

      nowSpy.mockReturnValue(13_000)
      sink.log('error', undefined, 'Failed to connect.', new Error('Store is closed'))
      await flush()
      expect(deleteLocalState).toHaveBeenCalledTimes(1)
      expect(reload).toHaveBeenCalledTimes(1)
    } finally {
      nowSpy.mockRestore()
    }
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

  test('recovery log classification is narrow', () => {
    const sqliteError = new Error('This statement has been finalized')
    sqliteError.name = 'SqliteError'
    expect(
      classifyZeroRecoveryLog('error', ['Error running.', sqliteError]),
    ).toMatchObject({
      reason: 'sqlite-statement-finalized',
      dropLocalState: true,
    })
    expect(
      classifyZeroRecoveryLog('error', [
        { name: 'SqliteError', message: 'database is locked' },
      ]),
    ).toBeUndefined()
    expect(
      classifyZeroRecoveryLog('warn', ['Expected IndexedDB not found']),
    ).toBeUndefined()
    expect(classifyZeroRecoveryLog('error', ['Store is closed'], 10_000)).toBeUndefined()
    expect(classifyZeroRecoveryLog('error', ['Store is closed'], 11_000)).toBeUndefined()
    expect(classifyZeroRecoveryLog('error', ['Store is closed'], 14_000)).toMatchObject({
      reason: 'store-closed-repeat',
      dropLocalState: true,
    })
    resetRecoveryStateForTests()
    expect(
      classifyZeroRecoveryLog(
        'error',
        ['Mutator "send" error on server', 'Store is closed'],
        20_000,
      ),
    ).toBeUndefined()
  })

  // a host with a `window` shim but no real `location` — the sootsim tenant
  // render-worker, which hides `location` for isolation. the DEFAULT reload
  // path (no injected `deps.reload`) must still drop stale IDB and not throw
  // "reading 'reload'" on undefined; it no-ops the reload and lets the host
  // remount. previously crashed as an unhandled rejection.
  test('default reload path is a safe no-op when location is absent', async () => {
    const events: ZeroEvent[] = []
    const zeroEvents = createEmitter<ZeroEvent | null>(
      `test-recover-${emitterSeq++}`,
      null,
    )
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
    expect(events).toContainEqual({
      type: 'recovering',
      reason: 'client state not found',
    })
  })

  test('scheduleReload defers the reload AND the store delete until performReload runs', async () => {
    const { deps, deleteLocalState, reload } = setup()
    let captured: ScheduleReloadContext | undefined
    deps.scheduleReload = (ctx) => {
      captured = ctx
    }
    makeZeroRecovery(deps).onClientStateNotFound()
    await flush()
    // deferred: nothing reloaded and the store is NOT yet deleted (so the app
    // isn't left running on a deleted store while the reload is gated).
    expect(reload).not.toHaveBeenCalled()
    expect(deleteLocalState).not.toHaveBeenCalled()
    expect(captured).toMatchObject({
      reasonKey: 'client-state-not-found',
      dropLocalState: true,
    })
    await captured!.performReload()
    await flush()
    expect(deleteLocalState).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('scheduleReload that reloads directly skips the delete and beforeReload', async () => {
    const { deps, deleteLocalState, reload } = setup()
    const nativeReload = vi.fn()
    const beforeReload = vi.fn(async () => {})
    deps.beforeReload = beforeReload
    deps.scheduleReload = () => {
      nativeReload()
    }

    makeZeroRecovery(deps).onClientStateNotFound()
    await flush()

    expect(nativeReload).toHaveBeenCalledTimes(1)
    expect(deleteLocalState).not.toHaveBeenCalled()
    expect(beforeReload).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  test('scheduleReload performReload is idempotent (one reload even if called twice)', async () => {
    const { deps, deleteLocalState, reload } = setup()
    let captured: ScheduleReloadContext | undefined
    deps.scheduleReload = (ctx) => {
      captured = ctx
    }
    makeZeroRecovery(deps).onClientStateNotFound()
    await flush()
    await captured!.performReload()
    await captured!.performReload()
    await flush()
    expect(deleteLocalState).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('scheduleReload deferred PAST the latch timeout still deletes and reloads exactly once', async () => {
    vi.useFakeTimers()
    try {
      const { deps, deleteLocalState, reload } = setup()
      let captured: ScheduleReloadContext | undefined
      deps.scheduleReload = (ctx) => {
        captured = ctx
      }
      makeZeroRecovery(deps).onClientStateNotFound()
      expect(captured).toBeDefined()

      // the consumer holds performReload behind a gate for longer than the latch
      // timeout (soot's IDE gate can hold for minutes). the timeout re-opens
      // scheduling but must NOT drop the pending delete thunk.
      await vi.advanceTimersByTimeAsync(20_000)
      expect(deleteLocalState).not.toHaveBeenCalled()
      expect(reload).not.toHaveBeenCalled()

      // when the consumer finally commits, the store STILL gets dropped and the
      // reload fires exactly once — never a bare reload back onto the bad store.
      await captured!.performReload()
      expect(deleteLocalState).toHaveBeenCalledTimes(1)
      expect(reload).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  test('a slow beforeReload holds the latch through the timeout window (no double reload)', async () => {
    vi.useFakeTimers()
    try {
      const { deps, reload } = setup()
      let releaseBeforeReload: () => void = () => {}
      deps.beforeReload = () =>
        new Promise<void>((resolve) => {
          releaseBeforeReload = resolve
        })
      const recovery = makeZeroRecovery(deps)
      // default path: performReload runs immediately, disarms the latch, then
      // blocks on beforeReload (soot's waitForOriginReachable can exceed 15s).
      recovery.onClientStateNotFound()
      await vi.advanceTimersByTimeAsync(20_000)
      // a second recovery arrives while the first reload is still in-flight.
      recovery.onClientStateNotFound()
      await vi.advanceTimersByTimeAsync(0)
      expect(reload).not.toHaveBeenCalled()
      // releasing the first beforeReload reloads exactly once, never twice.
      releaseBeforeReload()
      await vi.advanceTimersByTimeAsync(0)
      expect(reload).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  test('injectable guardStorage gives cross-reload loop protection (Hermes has no sessionStorage)', async () => {
    const store = new Map<string, string>()
    const { deps, reload, events } = setup()
    deps.guardStorage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, value)
      },
    }
    const recovery = makeZeroRecovery(deps)
    recovery.onClientStateNotFound()
    await flush()
    expect(reload).toHaveBeenCalledTimes(1)
    // a reload wipes in-memory state but NOT the injected store.
    resetRecoveryStateForTests()
    recovery.onClientStateNotFound()
    await flush()
    // the injected store catches the immediate re-fire → fatal, no reload storm.
    expect(reload).toHaveBeenCalledTimes(1)
    expect(events.some((event) => event.type === 'fatal')).toBe(true)
  })

  test('a guardStorage that throws never crashes recovery (in-memory is the floor)', async () => {
    const { deps, reload } = setup()
    deps.guardStorage = {
      getItem: () => {
        throw new Error('no storage on this platform')
      },
      setItem: () => {
        throw new Error('no storage on this platform')
      },
    }
    makeZeroRecovery(deps).onClientStateNotFound()
    await flush()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('classifier recognizes the mutation / connection desync class', () => {
    const cases: Array<[readonly unknown[], string]> = [
      [['sent mutation ID 5 but expected 4'], 'mutation-desync'],
      [['oooMutation detected'], 'mutation-desync'],
      [['Server reported an out-of-order mutation'], 'mutation-desync'],
      [['Ignoring mutation 3, already processed. Expected: 4'], 'mutation-desync'],
      [['InvalidConnectionRequestLastMutationID'], 'mutation-desync'],
      [['InvalidConnectionRequestBaseCookie'], 'connection-cookie-invalid'],
      [['ClientNotFound: client gone'], 'client-not-found'],
      [['connection userID mismatch'], 'connection-userid-mismatch'],
    ]
    for (const [args, reason] of cases) {
      expect(classifyZeroRecoveryLog('error', args)).toMatchObject({
        reason,
        dropLocalState: true,
      })
    }
    // still narrow: app-infra strings and non-error levels do NOT classify.
    expect(
      classifyZeroRecoveryLog('error', ['consecutive server-ack timeouts']),
    ).toBeUndefined()
    expect(
      classifyZeroRecoveryLog('error', ['Connection attempt timed out after 10 seconds']),
    ).toBeUndefined()
    expect(classifyZeroRecoveryLog('warn', ['ClientNotFound'])).toBeUndefined()
  })

  test('benignLogFilter suppresses recovery for a matching classified log', async () => {
    const { deps, deleteLocalState, reload } = setup()
    deps.benignLogFilter = (message) => message.includes('ClientNotFound')
    const sink = composeRecoveryLogSink(deps)
    sink.log('error', undefined, 'ClientNotFound: gone')
    await flush()
    expect(deleteLocalState).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
    // a non-benign desync still recovers through the same sink.
    sink.log('error', undefined, 'sent mutation ID 5 but expected 4')
    await flush()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('isRecoverableZeroStalePokeMessage matches only the stale-cookie signatures', () => {
    expect(
      isRecoverableZeroStalePokeMessage(
        'Server returned unexpected base cookie during sync',
      ),
    ).toBe(true)
    expect(
      isRecoverableZeroStalePokeMessage(
        'Received cookie 5 is < than last snapshot cookie 9, ignoring client view',
      ),
    ).toBe(true)
    expect(isRecoverableZeroStalePokeMessage('client state not found')).toBe(false)
  })
})
