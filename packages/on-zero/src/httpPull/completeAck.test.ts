import { afterEach, expect, test } from 'vitest'

import {
  eventually,
  startZeroHttpHarness,
  waitForComplete,
  type ZeroHttpHarness,
} from './testHarness'

// repro for the soot `sb read-state` hang (2026-07-10): named-query `complete`
// never resolves for queries that were already desired when the socket
// (re)connects, while queries desired after connect ack fine. these tests pin
// the got-ack contract across the transport's reconnect path.

let harness: ZeroHttpHarness | undefined

afterEach(async () => {
  await harness?.close()
  harness = undefined
})

test('query desired before first connect reaches complete', async () => {
  harness = await startZeroHttpHarness({
    seed: { user: [{ id: 'u1', name: 'ada' }] },
  })
  const zero = harness.createZero('u1')
  // materialize synchronously after construction so the desired query rides
  // the initial connection handshake, not a later changeDesiredQueries.
  const view = zero.query.user.materialize()
  const rows = await waitForComplete<any[]>(view)
  expect(rows).toEqual([{ id: 'u1', name: 'ada' }])
  view.destroy()
})

test('existing + new queries reach complete again after a transport drop', async () => {
  let failNextPull = false
  harness = await startZeroHttpHarness({
    seed: {
      user: [{ id: 'u1', name: 'ada' }],
      project: [{ id: 'p1', ownerId: 'u1', name: 'first' }],
    },
    interceptFetch: (next) => (input, init) => {
      const url = String(input)
      if (failNextPull && url.endsWith('/pull')) {
        failNextPull = false
        return Promise.reject(new Error('injected transient pull failure'))
      }
      return next(input, init)
    },
  })
  const zero = harness.createZero('u1')

  const userView = zero.query.user.materialize()
  await waitForComplete<any[]>(userView)

  // drop the socket: a failed pull closes it (1011) and zero reconnects with
  // every currently-desired query in the connection handshake.
  failNextPull = true
  await harness.transport.pull().catch(() => {})

  // wait until sync is live again (a write round-trips).
  const mutation = zero.mutate.project.create({ id: 'p2', ownerId: 'u1', name: 'second' })
  await mutation.client
  await mutation.server.catch(() => {})

  // the already-desired query must be able to reach complete again on the new
  // socket (this is what sb read-state does: re-run an already-subscribed
  // named query with {type:'complete'}).
  const userAgain = zero.query.user.materialize()
  await waitForComplete<any[]>(userAgain)

  // and a query desired only after the reconnect must too.
  const projectView = zero.query.project.materialize()
  const projects = await waitForComplete<any[]>(projectView)
  expect(projects.map((p: any) => p.id).sort()).toEqual(['p1', 'p2'])

  userView.destroy()
  userAgain.destroy()
  projectView.destroy()
})
