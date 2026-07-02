// @vitest-environment jsdom

import { createSchema, string, table } from '@rocicorp/zero'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const fakeZero = vi.hoisted(() => {
  class FakeZero {
    readonly context = {}
    readonly connection = {
      state: {
        current: { name: 'closed' },
        subscribe: () => () => {},
      },
      connect: vi.fn(),
    }
    readonly delete = vi.fn(async () => ({ errors: [] }))
    readonly close = vi.fn()
    readonly run = vi.fn(async () => [])
    readonly preload = vi.fn(() => ({
      cleanup: () => {},
      complete: Promise.resolve(),
    }))

    constructor() {
      instances.push(this)
    }
  }

  const instances: FakeZero[] = []
  return { FakeZero, instances }
})

vi.mock('@rocicorp/zero', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@rocicorp/zero')>()
  return {
    ...actual,
    Zero: fakeZero.FakeZero,
  }
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
  instanceName: 'recovery-cache-test',
})

let container: HTMLDivElement
let root: Root | null

beforeEach(() => {
  fakeZero.instances.length = 0
  container = document.createElement('div')
  root = null
})

afterEach(() => {
  if (root) act(() => root?.unmount())
})

async function mount() {
  root = createRoot(container)
  await act(async () => {
    root?.render(
      <client.ProvideZero cacheURL="http://127.0.0.1:7777/zero" userID="agentbus">
        <span>ok</span>
      </client.ProvideZero>,
    )
    await Promise.resolve()
  })
}

test('zero.delete invalidates cached instance before a remount recovery', async () => {
  await mount()
  const first = fakeZero.instances[0]
  expect(first).toBeDefined()

  const deleteZero = client.zero.delete
  await act(async () => {
    await deleteZero()
  })

  expect(first?.delete).toHaveBeenCalledTimes(1)
  expect(first?.close).toHaveBeenCalledTimes(1)

  act(() => root?.unmount())
  await mount()

  expect(fakeZero.instances).toHaveLength(2)
  expect(fakeZero.instances[1]).not.toBe(first)
})

test('remint drops local state and reconstructs a fresh instance in place', async () => {
  // unique userID so instanceKey misses the module-level cache from prior tests
  // and a fresh instance is genuinely constructed here.
  root = createRoot(container)
  await act(async () => {
    root?.render(
      <client.ProvideZero cacheURL="http://127.0.0.1:7777/zero" userID="remint-test">
        <span>ok</span>
      </client.ProvideZero>,
    )
    await Promise.resolve()
  })
  const first = fakeZero.instances.at(-1)
  expect(first).toBeDefined()
  const countBefore = fakeZero.instances.length

  let result: boolean | undefined
  await act(async () => {
    result = await client.remint()
    // let the generation bump re-render and the rotate effect mint the fresh one
    await Promise.resolve()
  })

  expect(result).toBe(true)
  // dropped the rejected store + closed it, then minted a genuinely new client
  // without unmounting the provider (no page reload).
  expect(first?.delete).toHaveBeenCalledTimes(1)
  expect(fakeZero.instances.length).toBe(countBefore + 1)
  expect(fakeZero.instances.at(-1)).not.toBe(first)
})

test('remint with no provider mounted returns false without burning the guard budget', async () => {
  // own client so the shared remint guard state is fresh for this assertion.
  const isolated = createZeroClient({
    schema,
    models: {},
    groupedQueries: {},
    instanceName: 'remint-unmounted-test',
  })

  // nothing mounted → remintControl.bump is null. these must NOT start the 12s
  // cooldown or consume the attempt budget.
  expect(await isolated.remint()).toBe(false)
  expect(await isolated.remint()).toBe(false)

  root = createRoot(container)
  await act(async () => {
    root?.render(
      <isolated.ProvideZero
        cacheURL="http://127.0.0.1:7777/zero"
        userID="remint-unmounted"
      >
        <span>ok</span>
      </isolated.ProvideZero>,
    )
    await Promise.resolve()
  })

  // a mounted remint immediately after is still allowed — proof the unmounted
  // calls didn't burn the guard (old code set lastRemintAt before this check).
  let result: boolean | undefined
  await act(async () => {
    result = await isolated.remint()
    await Promise.resolve()
  })
  expect(result).toBe(true)
})
