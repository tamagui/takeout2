// @vitest-environment jsdom

import { createSchema, string, table } from '@rocicorp/zero'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

// a controllable connection whose state useConnectionState (useSyncExternalStore)
// subscribes to — set() notifies listeners so ConnectionMonitor's effect re-runs.
const fakeZero = vi.hoisted(() => {
  class FakeConnectionState {
    current: { name: string; reason?: string }
    listeners = new Set<() => void>()
    constructor(initial: { name: string; reason?: string }) {
      this.current = initial
    }
    subscribe = (cb: () => void) => {
      this.listeners.add(cb)
      return () => {
        this.listeners.delete(cb)
      }
    }
    set(next: { name: string; reason?: string }) {
      this.current = next
      for (const cb of this.listeners) cb()
    }
  }

  class FakeZero {
    readonly context = {}
    readonly connection = {
      state: new FakeConnectionState({ name: 'connecting' }),
      connect: vi.fn(async () => {}),
    }
    readonly delete = vi.fn(async () => ({ errors: [] }))
    readonly close = vi.fn()
    readonly run = vi.fn(async () => [])
    readonly preload = vi.fn(() => ({ cleanup: () => {}, complete: Promise.resolve() }))

    constructor() {
      instances.push(this)
    }
  }

  const instances: FakeZero[] = []
  return { FakeZero, FakeConnectionState, instances }
})

vi.mock('@rocicorp/zero', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@rocicorp/zero')>()
  return { ...actual, Zero: fakeZero.FakeZero }
})

import { createZeroClient } from './createZeroClient'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const noteTable = table('note').columns({ id: string(), body: string() }).primaryKey('id')
const schema = createSchema({ tables: [noteTable] })

const client = createZeroClient({
  schema,
  models: {},
  groupedQueries: {},
  instanceName: 'connection-test',
})

let container: HTMLDivElement
let root: Root | null

beforeEach(() => {
  fakeZero.instances.length = 0
  container = document.createElement('div')
  root = null
  delete document.body.dataset.zeroState
  delete document.body.dataset.zeroConnected
  delete document.body.dataset.zeroReason
})

afterEach(() => {
  if (root) act(() => root?.unmount())
})

async function mount(extraProps: Record<string, unknown> = {}, userID = 'conn') {
  root = createRoot(container)
  await act(async () => {
    root?.render(
      <client.ProvideZero
        cacheURL="http://127.0.0.1:7788/zero"
        userID={userID}
        {...extraProps}
      >
        <span>ok</span>
      </client.ProvideZero>,
    )
    await Promise.resolve()
  })
  return fakeZero.instances.at(-1)!
}

test('waitForZero resolves when the provider publishes its active instance', async () => {
  const readinessClient = createZeroClient({
    schema,
    models: {},
    groupedQueries: {},
    instanceName: 'readiness-test',
  })
  const ready = readinessClient.waitForZero()

  root = createRoot(container)
  await act(async () => {
    root?.render(
      <readinessClient.ProvideZero
        cacheURL="http://127.0.0.1:7788/zero"
        userID="readiness"
      >
        <span>ok</span>
      </readinessClient.ProvideZero>,
    )
    await Promise.resolve()
  })

  expect(await ready).toBe(fakeZero.instances.at(-1))
})

test('installs the supplied client transport for the provider server', async () => {
  const install = vi.fn()

  await mount({ transport: { install } }, 'transport-test')

  expect(install).toHaveBeenCalledOnce()
  expect(install).toHaveBeenCalledWith('http://127.0.0.1:7788/zero')
})

test('refreshAuth reconnects in place on needs-auth, once per transition', async () => {
  const refreshAuth = vi.fn(async () => 'fresh-token')
  const instance = await mount({ refreshAuth }, 'conn-auth')

  await act(async () => {
    instance.connection.state.set({ name: 'needs-auth', reason: 'token expired' })
    await Promise.resolve()
  })

  expect(refreshAuth).toHaveBeenCalledTimes(1)
  await act(async () => {
    await Promise.resolve()
  })
  expect(instance.connection.connect).toHaveBeenCalledWith({ auth: 'fresh-token' })
})

test('stale-poke error reconnects instead of surfacing a fatal error', async () => {
  const events: Array<{ type: string }> = []
  const off = client.zeroEvents.listen((event) => {
    if (event) events.push(event)
  })
  const instance = await mount({}, 'conn-stale')

  await act(async () => {
    instance.connection.state.set({
      name: 'error',
      reason: 'Server returned unexpected base cookie during sync',
    })
    await Promise.resolve()
  })

  // reconnect issued, no auth arg (plain resume)
  expect(instance.connection.connect).toHaveBeenCalledTimes(1)
  expect(instance.connection.connect).toHaveBeenCalledWith()
  // the stale-poke reason must NOT be emitted as an error event
  expect(events.some((event) => event.type === 'error')).toBe(false)
  off()
})

test('connectionDataset mirrors connection state onto the body dataset', async () => {
  const instance = await mount({ connectionDataset: true }, 'conn-dataset')

  await act(async () => {
    instance.connection.state.set({ name: 'connected' })
    await Promise.resolve()
  })
  expect(document.body.dataset.zeroState).toBe('connected')
  expect(document.body.dataset.zeroConnected).toBe('true')
  expect(document.body.dataset.zeroCacheUrl).toBe('http://127.0.0.1:7788/zero')

  await act(async () => {
    instance.connection.state.set({ name: 'error', reason: 'boom' })
    await Promise.resolve()
  })
  expect(document.body.dataset.zeroState).toBe('error')
  expect(document.body.dataset.zeroConnected).toBeUndefined()
  expect(document.body.dataset.zeroReason).toBe('boom')
})

test('fatal error state stays terminal and reports the reason', async () => {
  vi.useFakeTimers()
  try {
    const instance = await mount({}, 'conn-fatal')
    const events: Array<{ type: string; message?: string }> = []
    const off = client.zeroEvents.listen((event) => {
      if (event) events.push(event)
    })

    await act(async () => {
      instance.connection.state.set({
        name: 'error',
        reason: 'Got open event but connect start time is undefined',
      })
      await Promise.resolve()
    })

    await act(async () => {
      vi.advanceTimersByTime(60_000)
      await Promise.resolve()
    })
    expect(instance.connection.connect).not.toHaveBeenCalled()
    expect(events).toContainEqual({
      type: 'error',
      message: 'Got open event but connect start time is undefined',
    })
    off()
  } finally {
    vi.useRealTimers()
  }
})
