import { afterEach, describe, expect, test } from 'vitest'

import {
  eventually,
  sleep,
  startZeroHttpHarness,
  waitForComplete,
  type ZeroHttpHarness,
} from './testHarness'

let harness: ZeroHttpHarness | undefined

type UserRow = { id: string; name: string }
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

describe('zero-http auth parity', () => {
  test('real clients only emit rows visible to their auth token', async () => {
    harness = await startZeroHttpHarness({
      seed: {
        user: [
          { id: 'u1', name: 'ada' },
          { id: 'u2', name: 'ben' },
        ],
        project: [
          { id: 'p-u1', ownerId: 'u1', name: 'u1 private' },
          { id: 'p-u2', ownerId: 'u2', name: 'u2 private' },
          { id: 'p-shared', ownerId: 'u2', name: 'shared' },
        ],
        member: [
          { id: 'm-u1-owner', projectId: 'p-u1', userId: 'u1' },
          { id: 'm-u2-owner', projectId: 'p-u2', userId: 'u2' },
          { id: 'm-shared-u1', projectId: 'p-shared', userId: 'u1' },
          { id: 'm-shared-u2', projectId: 'p-shared', userId: 'u2' },
        ],
      },
    })
    const u1 = harness.createZero('u1')
    const u2 = harness.createZero('u2')

    const u1Users = u1.query.user.materialize()
    const u1Projects = u1.query.project.related('members').materialize()
    const u2Users = u2.query.user.materialize()
    const u2Projects = u2.query.project.related('members').materialize()

    const u1UserEmissions: UserRow[][] = []
    const u1ProjectEmissions: ProjectWithMembers[][] = []
    const u2UserEmissions: UserRow[][] = []
    const u2ProjectEmissions: ProjectWithMembers[][] = []

    const stops = [
      captureRows(u1Users, u1UserEmissions, normalizeUsers),
      captureRows(u1Projects, u1ProjectEmissions, normalizeProjects),
      captureRows(u2Users, u2UserEmissions, normalizeUsers),
      captureRows(u2Projects, u2ProjectEmissions, normalizeProjects),
    ]

    try {
      const [u1UsersComplete, u1ProjectsComplete, u2UsersComplete, u2ProjectsComplete] =
        await Promise.all([
          waitForComplete<UserRow[]>(u1Users),
          waitForComplete<ProjectWithMembers[]>(u1Projects),
          waitForComplete<UserRow[]>(u2Users),
          waitForComplete<ProjectWithMembers[]>(u2Projects),
        ])

      expect(normalizeUsers(u1UsersComplete)).toEqual([{ id: 'u1', name: 'ada' }])
      expect(normalizeProjects(u1ProjectsComplete)).toEqual([
        {
          id: 'p-shared',
          ownerId: 'u2',
          name: 'shared',
          members: [
            { id: 'm-shared-u1', projectId: 'p-shared', userId: 'u1' },
            { id: 'm-shared-u2', projectId: 'p-shared', userId: 'u2' },
          ],
        },
        {
          id: 'p-u1',
          ownerId: 'u1',
          name: 'u1 private',
          members: [{ id: 'm-u1-owner', projectId: 'p-u1', userId: 'u1' }],
        },
      ])

      expect(normalizeUsers(u2UsersComplete)).toEqual([{ id: 'u2', name: 'ben' }])
      expect(normalizeProjects(u2ProjectsComplete)).toEqual([
        {
          id: 'p-shared',
          ownerId: 'u2',
          name: 'shared',
          members: [
            { id: 'm-shared-u1', projectId: 'p-shared', userId: 'u1' },
            { id: 'm-shared-u2', projectId: 'p-shared', userId: 'u2' },
          ],
        },
        {
          id: 'p-u2',
          ownerId: 'u2',
          name: 'u2 private',
          members: [{ id: 'm-u2-owner', projectId: 'p-u2', userId: 'u2' }],
        },
      ])

      assertNoUserEmission(u1UserEmissions, 'u2')
      assertNoProjectEmission(u1ProjectEmissions, 'p-u2', 'm-u2-owner')
      assertNoUserEmission(u2UserEmissions, 'u1')
      assertNoProjectEmission(u2ProjectEmissions, 'p-u1', 'm-u1-owner')

      await harness.transport.pull()
      await sleep(50)
      assertNoUserEmission(u1UserEmissions, 'u2')
      assertNoProjectEmission(u1ProjectEmissions, 'p-u2', 'm-u2-owner')
      assertNoUserEmission(u2UserEmissions, 'u1')
      assertNoProjectEmission(u2ProjectEmissions, 'p-u1', 'm-u1-owner')
    } finally {
      for (const stop of stops) stop()
      u1Users.destroy()
      u1Projects.destroy()
      u2Users.destroy()
      u2Projects.destroy()
    }
  })

  test('unknown token 401 reaches needs-auth without materializing data', async () => {
    harness = await startZeroHttpHarness({
      seed: {
        user: [{ id: 'u1', name: 'ada' }],
        project: [{ id: 'p-u1', ownerId: 'u1', name: 'u1 private' }],
        member: [{ id: 'm-u1-owner', projectId: 'p-u1', userId: 'u1' }],
      },
    })
    const unknown = harness.createZero('missing')
    const projects = unknown.query.project.related('members').materialize()
    const emissions: ProjectWithMembers[][] = []
    const stop = captureRows(projects, emissions, normalizeProjects)

    try {
      await eventually(() =>
        expect(unknown.connection.state.current.name).toBe('needs-auth'),
      )
      await sleep(50)

      expect(projects.data).toEqual([])
      expect(emissions.every((emission) => emission.length === 0)).toBe(true)
    } finally {
      stop()
      projects.destroy()
    }
  })
})

// listener data is Immutable<T>; normalize maps to fresh mutable rows
function captureRows<T>(
  view: { addListener(listener: (data: any, resultType: string) => void): () => void },
  emissions: T[],
  normalize: (data: T) => T,
) {
  return view.addListener((data) => {
    emissions.push(normalize(data))
  })
}

function assertNoUserEmission(emissions: UserRow[][], privateUserID: string) {
  for (const emission of emissions) {
    expect(emission.map((row) => row.id)).not.toContain(privateUserID)
  }
}

function assertNoProjectEmission(
  emissions: ProjectWithMembers[][],
  privateProjectID: string,
  privateMemberID: string,
) {
  for (const emission of emissions) {
    expect(emission.map((row) => row.id)).not.toContain(privateProjectID)
    expect(
      emission.flatMap((row) => row.members.map((member) => member.id)),
    ).not.toContain(privateMemberID)
  }
}

function normalizeUsers(users: UserRow[]) {
  return clone(users).sort((a, b) => a.id.localeCompare(b.id))
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
