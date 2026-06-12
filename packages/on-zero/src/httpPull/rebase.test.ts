import { afterEach, expect, test } from 'vitest'

import {
  eventually,
  startZeroHttpHarness,
  waitForComplete,
  type ZeroHttpHarness,
} from './testHarness'

let harness: ZeroHttpHarness | undefined

afterEach(async () => {
  await harness?.close()
  harness = undefined
})

test('ack-then-pull keeps optimistic rows visible until the authoritative snapshot lands', async () => {
  const postPushPull = deferred<void>()
  const postPushPullStarted = deferred<void>()
  let shouldHoldPostPushPull = false

  harness = await startZeroHttpHarness({
    seed: {
      user: [{ id: 'u1', name: 'ada' }],
      project: [{ id: 'p1', ownerId: 'u1', name: 'first' }],
      member: [],
    },
    interceptFetch: (next) => async (input, init) => {
      const path = new URL(String(input)).pathname
      if (path === '/push') {
        const response = await next(input, init)
        shouldHoldPostPushPull = true
        return response
      }
      if (path === '/pull' && shouldHoldPostPushPull) {
        shouldHoldPostPushPull = false
        postPushPullStarted.resolve()
        await postPushPull.promise
      }
      return next(input, init)
    },
  })
  const zero = harness.createZero('u1')
  const view = zero.query.project.materialize()
  await waitForComplete<any[]>(view)
  const emissions = recordEmissions(view)

  const mutation = zero.mutate.project.create({
    id: 'p2',
    ownerId: 'u1',
    name: 'second',
  })
  await mutation.client
  await eventually(() => expect(projectIDs(view.data)).toContain('p2'))
  await mutation.server
  await postPushPullStarted.promise

  expect(projectIDs(view.data)).toContain('p2')
  postPushPull.resolve()
  await harness.transport.pull()
  await eventually(() => expect(projectIDs(view.data).sort()).toEqual(['p1', 'p2']))

  expectNeverDisappearsAfterFirstSeen(emissions, 'p2')
  expect(harness.server.rows('project').sort(byID)).toEqual([
    { id: 'p1', ownerId: 'u1', name: 'first' },
    { id: 'p2', ownerId: 'u1', name: 'second' },
  ])
  emissions.cleanup()
  view.destroy()
})

test('pull-then-ack rebases optimistic rows over a newer snapshot', async () => {
  const pushGate = deferred<void>()
  const pushStarted = deferred<any>()

  harness = await startZeroHttpHarness({
    seed: {
      user: [{ id: 'u1', name: 'ada' }],
      project: [{ id: 'p1', ownerId: 'u1', name: 'first' }],
      member: [],
    },
    interceptFetch: (next) => async (input, init) => {
      const path = new URL(String(input)).pathname
      if (path === '/push') {
        const body = JSON.parse(String(init?.body))
        pushStarted.resolve(body)
        await pushGate.promise
      }
      return next(input, init)
    },
  })
  const zero = harness.createZero('u1')
  const view = zero.query.project.materialize()
  await waitForComplete<any[]>(view)
  const emissions = recordEmissions(view)

  const mutation = zero.mutate.project.create({
    id: 'p2',
    ownerId: 'u1',
    name: 'optimistic',
  })
  await mutation.client
  await eventually(() => expect(projectIDs(view.data)).toContain('p2'))

  const heldPush = await pushStarted.promise
  await rawPush(harness, {
    clientGroupID: heldPush.clientGroupID,
    clientID: 'server-side',
    id: 1,
    name: 'project|create',
    args: { id: 'p-server', ownerId: 'u1', name: 'server change' },
  })
  await harness.transport.pull()

  await eventually(() =>
    expect(projectIDs(view.data).sort()).toEqual(['p-server', 'p1', 'p2']),
  )
  expect(
    harness.server
      .rows('project')
      .map((row) => row.id)
      .sort(),
  ).toEqual(['p-server', 'p1'])

  pushGate.resolve()
  await mutation.server
  await harness.transport.pull()
  await eventually(() =>
    expect(projectIDs(view.data).sort()).toEqual(['p-server', 'p1', 'p2']),
  )

  expectNeverDisappearsAfterFirstSeen(emissions, 'p2')
  expect(harness.server.rows('project').sort(byID)).toEqual([
    { id: 'p-server', ownerId: 'u1', name: 'server change' },
    { id: 'p1', ownerId: 'u1', name: 'first' },
    { id: 'p2', ownerId: 'u1', name: 'optimistic' },
  ])
  emissions.cleanup()
  view.destroy()
})

test('app-error rollback advances LMID and reverts optimistic state after pull', async () => {
  const pushGate = deferred<void>()
  const pushStarted = deferred<void>()
  let clientGroupID = ''

  harness = await startZeroHttpHarness({
    seed: {
      user: [
        { id: 'u1', name: 'ada' },
        { id: 'u2', name: 'ben' },
      ],
      project: [{ id: 'p1', ownerId: 'u2', name: 'shared' }],
      member: [{ id: 'm1', projectId: 'p1', userId: 'u1' }],
    },
    interceptFetch: (next) => async (input, init) => {
      if (new URL(String(input)).pathname === '/push') {
        const body = JSON.parse(String(init?.body))
        clientGroupID = body.clientGroupID
        pushStarted.resolve()
        await pushGate.promise
      }
      return next(input, init)
    },
  })
  const zero = harness.createZero('u1')
  const view = zero.query.project.materialize()
  await waitForComplete<any[]>(view)
  const emissions = recordEmissions(view)

  const mutation = zero.mutate.project.rename({ id: 'p1', name: 'stolen' })
  await mutation.client
  await pushStarted.promise
  expect(projectName(view.data, 'p1')).toBe('stolen')
  expect(harness.server.rows('project')).toEqual([
    { id: 'p1', ownerId: 'u2', name: 'shared' },
  ])

  pushGate.resolve()
  await expect(mutation.server).resolves.toMatchObject({
    type: 'error',
    error: {
      type: 'app',
      details: 'forbidden',
    },
  })

  await harness.transport.pull()
  await eventually(() => expect(projectName(view.data, 'p1')).toBe('shared'))
  expect(emissions.values.map((rows) => projectName(rows, 'p1'))).toContain('stolen')
  expect(emissions.values.at(-1)?.[0]).toEqual({
    id: 'p1',
    ownerId: 'u2',
    name: 'shared',
  })
  expect(harness.server.rows('project')).toEqual([
    { id: 'p1', ownerId: 'u2', name: 'shared' },
  ])

  const pull = await rawPull(harness, 'u1', { clientGroupID })
  expect(Object.values(pull.lastMutationIDChanges)).toContain(1)
  emissions.cleanup()
  view.destroy()
})

test('app-error rollback removes phantom optimistic create after pull', async () => {
  const pushGate = deferred<void>()
  const pushStarted = deferred<void>()
  let clientGroupID = ''

  harness = await startZeroHttpHarness({
    seed: {
      user: [
        { id: 'u1', name: 'ada' },
        { id: 'u2', name: 'ben' },
      ],
      project: [],
      member: [],
    },
    interceptFetch: (next) => async (input, init) => {
      if (new URL(String(input)).pathname === '/push') {
        const body = JSON.parse(String(init?.body))
        clientGroupID = body.clientGroupID
        pushStarted.resolve()
        await pushGate.promise
      }
      return next(input, init)
    },
  })
  const zero = harness.createZero('u1')
  const view = zero.query.project.materialize()
  await waitForComplete<any[]>(view)
  const emissions = recordEmissions(view)

  const mutation = zero.mutate.project.create({
    id: 'p-phantom',
    ownerId: 'u2',
    name: 'forbidden',
  })
  await mutation.client
  await pushStarted.promise
  await eventually(() => expect(projectIDs(view.data)).toContain('p-phantom'))
  expect(harness.server.rows('project')).toEqual([])

  pushGate.resolve()
  await expect(mutation.server).resolves.toMatchObject({
    type: 'error',
    error: {
      type: 'app',
      details: 'forbidden',
    },
  })

  await harness.transport.pull()
  await eventually(() => expect(projectIDs(view.data)).not.toContain('p-phantom'))
  expect(emissions.values.some((rows) => projectIDs(rows).includes('p-phantom'))).toBe(
    true,
  )
  expect(emissions.values.at(-1)).toEqual([])
  expect(harness.server.rows('project')).toEqual([])

  const pull = await rawPull(harness, 'u1', { clientGroupID })
  expect(Object.values(pull.lastMutationIDChanges)).toContain(1)
  emissions.cleanup()
  view.destroy()
})

async function rawPush(
  harness: ZeroHttpHarness,
  mutation: {
    clientGroupID: string
    clientID: string
    id: number
    name: string
    args: Record<string, string>
  },
) {
  const response = await fetch(`${harness.server.url}/push`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer token-u1',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      timestamp: Date.now(),
      clientGroupID: mutation.clientGroupID,
      pushVersion: 1,
      requestID: `raw-${mutation.clientID}-${mutation.id}`,
      mutations: [
        {
          type: 'custom',
          name: mutation.name,
          id: mutation.id,
          clientID: mutation.clientID,
          args: [mutation.args],
        },
      ],
    }),
  })
  expect(response.status).toBe(200)
  return response.json()
}

async function rawPull(
  harness: ZeroHttpHarness,
  userID: string,
  body: { clientGroupID: string },
) {
  const response = await fetch(`${harness.server.url}/pull`, {
    method: 'POST',
    headers: {
      authorization: `Bearer token-${userID}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      clientID: 'raw-pull',
      clientGroupID: body.clientGroupID,
      cookie: null,
    }),
  })
  expect(response.status).toBe(200)
  return response.json() as Promise<{
    lastMutationIDChanges: Record<string, number>
  }>
}

function recordEmissions(view: {
  addListener(listener: (data: any) => void): () => void
}) {
  const values: any[][] = []
  const cleanup = view.addListener((data) => values.push(snapshot(data)))
  return { values, cleanup }
}

function snapshot(rows: any[]) {
  return JSON.parse(JSON.stringify(rows)) as any[]
}

function projectIDs(rows: any[]) {
  return rows.map((row) => row.id)
}

function projectName(rows: any[], id: string) {
  return rows.find((row) => row.id === id)?.name
}

function expectNeverDisappearsAfterFirstSeen(emissions: { values: any[][] }, id: string) {
  let seen = false
  for (const rows of emissions.values) {
    if (projectIDs(rows).includes(id)) seen = true
    if (seen) expect(projectIDs(rows)).toContain(id)
  }
  expect(seen).toBe(true)
}

function byID(a: Record<string, string>, b: Record<string, string>) {
  return a.id.localeCompare(b.id)
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
