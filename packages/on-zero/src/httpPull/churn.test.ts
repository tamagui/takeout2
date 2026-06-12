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

test('mutation burst converges while explicit pulls churn', async () => {
  let clientGroupID = ''
  const pullErrors: unknown[] = []

  harness = await startZeroHttpHarness({
    seed: {
      user: [{ id: 'u1', name: 'ada' }],
      project: [],
      member: [],
    },
    interceptFetch: (next) => async (input, init) => {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      if (body?.clientGroupID) clientGroupID = body.clientGroupID
      return next(input, init)
    },
  })
  const zero = harness.createZero('u1')
  const view = zero.query.project.materialize()
  await waitForComplete<any[]>(view)

  const timer = setInterval(() => {
    void harness?.transport.pull().catch((error) => pullErrors.push(error))
  }, 2)

  try {
    const mutations = Array.from({ length: 15 }, (_, index) =>
      zero.mutate.project.create({
        id: `p${index + 1}`,
        ownerId: 'u1',
        name: `project ${index + 1}`,
      }),
    )
    await Promise.all(mutations.map((mutation) => mutation.client))
    await Promise.all(mutations.map((mutation) => mutation.server))
    await harness.transport.pull()

    await eventually(() => {
      expect(projectIDs(view.data)).toEqual(
        Array.from({ length: 15 }, (_, index) => `p${index + 1}`).sort(),
      )
    })
  } finally {
    clearInterval(timer)
  }

  expect(pullErrors).toEqual([])
  expect(zero.connection.state.current.name).toBe('connected')
  expect(
    harness.server
      .rows('project')
      .map((row) => row.id)
      .sort(),
  ).toEqual(Array.from({ length: 15 }, (_, index) => `p${index + 1}`).sort())

  const pull = await rawPull(harness, clientGroupID)
  expect(Object.values(pull.lastMutationIDChanges)).toContain(15)
  view.destroy()
})

test('two clients sharing a client group converge without cookie fights', async () => {
  const clientGroups = new Set<string>()
  const clientIDs = new Set<string>()

  harness = await startZeroHttpHarness({
    seed: {
      user: [{ id: 'u1', name: 'ada' }],
      project: [{ id: 'p1', ownerId: 'u1', name: 'first' }],
      member: [],
    },
    interceptFetch: (next) => async (input, init) => {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      if (body?.clientGroupID) clientGroups.add(body.clientGroupID)
      if (body?.clientID) clientIDs.add(body.clientID)
      return next(input, init)
    },
  })

  const sharedStorageKey = 'zero-http-shared-client-group'
  const zeroA = harness.createZero('u1', { storageKey: sharedStorageKey })
  const zeroB = harness.createZero('u1', { storageKey: sharedStorageKey })
  const viewA = zeroA.query.project.materialize()
  const viewB = zeroB.query.project.materialize()
  await waitForComplete<any[]>(viewA)
  await waitForComplete<any[]>(viewB)

  expect(harness.transport.connections).toBe(2)
  expect(clientGroups.size).toBe(1)
  expect(clientIDs.size).toBe(2)

  const mutation = zeroA.mutate.project.create({
    id: 'p2',
    ownerId: 'u1',
    name: 'second',
  })
  await mutation.client
  await mutation.server
  await harness.transport.pull()

  await eventually(() => {
    expect(projectIDs(viewA.data)).toEqual(['p1', 'p2'])
    expect(projectIDs(viewB.data)).toEqual(['p1', 'p2'])
  })
  expect(zeroA.connection.state.current.name).toBe('connected')
  expect(zeroB.connection.state.current.name).toBe('connected')

  viewA.destroy()
  viewB.destroy()
})

async function rawPull(harness: ZeroHttpHarness, clientGroupID: string) {
  const response = await fetch(`${harness.server.url}/pull`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer token-u1',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      clientID: 'raw-pull',
      clientGroupID,
      cookie: null,
    }),
  })
  expect(response.status).toBe(200)
  return response.json() as Promise<{
    lastMutationIDChanges: Record<string, number>
  }>
}

function projectIDs(rows: any[]) {
  return rows.map((row) => row.id).sort()
}
