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

test('e2e smoke: stock zero client syncs over http against the fixture server', async () => {
  harness = await startZeroHttpHarness({
    seed: {
      user: [{ id: 'u1', name: 'ada' }],
      project: [{ id: 'p1', ownerId: 'u1', name: 'first' }],
      member: [{ id: 'm1', projectId: 'p1', userId: 'u1' }],
    },
  })
  const zero = harness.createZero('u1')

  const view = zero.query.project.related('members').materialize()
  const initial = await waitForComplete<any[]>(view)
  expect(initial).toEqual([
    {
      id: 'p1',
      ownerId: 'u1',
      name: 'first',
      members: [{ id: 'm1', projectId: 'p1', userId: 'u1' }],
    },
  ])

  const mutation = zero.mutate.project.create({
    id: 'p2',
    ownerId: 'u1',
    name: 'second',
  })
  await mutation.client
  await mutation.server

  await eventually(() => {
    const names = view.data.map((project: any) => project.name).sort()
    expect(names).toEqual(['first', 'second'])
  })
  expect(
    harness.server
      .rows('project')
      .map((row) => row.id)
      .sort(),
  ).toEqual(['p1', 'p2'])
  view.destroy()
})
