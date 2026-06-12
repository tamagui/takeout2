import { afterEach, expect, test } from 'vitest'

import {
  eventually,
  sleep,
  startZeroHttpHarness,
  waitForComplete,
  type ZeroHttpHarness,
} from './testHarness'

let harness: ZeroHttpHarness | undefined

type MemberRow = { id: string; projectId: string; userId: string }
type ProjectWithMembers = {
  id: string
  ownerId: string
  name: string
  members: MemberRow[]
}

afterEach(async () => {
  await harness?.close()
  harness = undefined
})

test('related project members appear, update, and vanish with visibility', async () => {
  harness = await startZeroHttpHarness({
    seed: {
      user: [
        { id: 'u1', name: 'ada' },
        { id: 'u2', name: 'ben' },
      ],
      project: [],
      member: [],
    },
  })
  const u1 = harness.createZero('u1')
  const u2 = harness.createZero('u2')
  const u1Projects = u1.query.project.related('members').materialize()
  const emissions: ProjectWithMembers[][] = []
  const stopCapture = captureProjectEmissions(u1Projects, emissions)

  try {
    await expect(waitForComplete<ProjectWithMembers[]>(u1Projects)).resolves.toEqual([])

    const created = u2.mutate.project.create({
      id: 'p-shared',
      ownerId: 'u2',
      name: 'shared',
    })
    await created.client
    await created.server

    const added = u2.mutate.member.add({
      id: 'm-u1-shared',
      projectId: 'p-shared',
      userId: 'u1',
    })
    await added.client
    await added.server

    await harness.transport.pull()
    await eventually(() => {
      expect(normalizeProjects(u1Projects.data as ProjectWithMembers[])).toEqual([
        {
          id: 'p-shared',
          ownerId: 'u2',
          name: 'shared',
          members: [{ id: 'm-u1-shared', projectId: 'p-shared', userId: 'u1' }],
        },
      ])
    })

    const renamed = u2.mutate.project.rename({
      id: 'p-shared',
      name: 'renamed shared',
    })
    await renamed.client
    await renamed.server

    await harness.transport.pull()
    await eventually(() => {
      expect(normalizeProjects(u1Projects.data as ProjectWithMembers[])).toEqual([
        {
          id: 'p-shared',
          ownerId: 'u2',
          name: 'renamed shared',
          members: [{ id: 'm-u1-shared', projectId: 'p-shared', userId: 'u1' }],
        },
      ])
    })

    const removed = u2.mutate.member.remove({ id: 'm-u1-shared' })
    await removed.client
    await removed.server

    await harness.transport.pull()
    await eventually(() => {
      expect(normalizeProjects(u1Projects.data as ProjectWithMembers[])).toEqual([])
      expect(emissions.at(-1)?.some((project) => project.id === 'p-shared')).toBe(false)
    })

    const emissionCountAfterRevocation = emissions.length
    await harness.transport.pull()
    await sleep(50)
    expect(emissions.length).toBe(emissionCountAfterRevocation)
  } finally {
    stopCapture()
    u1Projects.destroy()
  }
})

function captureProjectEmissions(
  view: {
    addListener(listener: (data: any, resultType: string) => void): () => void
  },
  emissions: ProjectWithMembers[][],
) {
  return view.addListener((data) => {
    emissions.push(normalizeProjects(data))
  })
}

function normalizeProjects(projects: ProjectWithMembers[]) {
  return clone(projects)
    .map((project) => ({
      ...project,
      members: [...project.members].sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
