import { createSchema, defineQueries, defineQuery, string, table } from '@rocicorp/zero'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import {
  authDataToClaims,
  createZeroServerBindings,
  type ZeroServerExecutor,
  type ZeroServerMutatorRegistry,
  type ZeroServerTransaction,
} from './server'
import { getScopedAuthData } from './helpers/mutatorContext'
import { zql } from './zql'

import type { AuthData, MutatorContext } from './types'

const project = table('project')
  .columns({
    id: string(),
    ownerId: string(),
    name: string(),
  })
  .primaryKey('id')

const schema = createSchema({
  tables: [project],
  relationships: [],
  enableLegacyQueries: true,
})

const queries = defineQueries({
  project: {
    byOwner: defineQuery(v.object({ ownerId: v.string() }), ({ args }) =>
      zql.project.where('ownerId', args.ownerId),
    ),
  },
})

type ProjectRow = { id: string; ownerId: string; name: string }

function createTestExecutor(
  mutators: ZeroServerMutatorRegistry<typeof schema>,
  rows: ProjectRow[],
) {
  const scheduledBackground: Promise<void>[] = []
  const tx = {
    mutate: {
      project: {
        async insert(value: ProjectRow) {
          rows.push(value)
        },
      },
    },
    async run() {
      return []
    },
  } as unknown as ZeroServerTransaction<typeof schema>

  const executor: ZeroServerExecutor<typeof schema> = {
    async execute(name, args, claims) {
      const barriers: Promise<void>[] = []
      const mutator = mutators[name]
      if (!mutator) throw new Error(`unknown mutator: ${name}`)
      await mutator({
        tx,
        args,
        ctx: {
          claims,
          defer(effect, options) {
            const promise = Promise.resolve().then(effect)
            if (options?.barrier) barriers.push(promise)
            else scheduledBackground.push(promise)
          },
        },
      })
      await Promise.all(barriers)
    },
    async transaction(_claims, work) {
      return work(tx)
    },
    async query(_claims, work) {
      return work(tx)
    },
  }

  return { executor, scheduledBackground }
}

describe('createZeroServerBindings', () => {
  test('an anonymous mutation keeps authData null so auth-required mutators reject', async () => {
    const rows: ProjectRow[] = []
    let seenAuthData: AuthData | null | undefined
    const bindings = createZeroServerBindings({
      schema,
      models: {
        project: {
          mutate: {
            create: async ({ authData, tx }: MutatorContext, value: ProjectRow) => {
              seenAuthData = authData
              if (!authData) throw new Error('not authenticated')
              await tx.mutate.project.insert(value)
            },
          },
        },
      },
      createServerActions: () => ({}),
      queries,
    })
    const { executor } = createTestExecutor(bindings.mutators, rows)
    const server = bindings.server(executor)

    await expect(
      server.mutate.project.create({
        id: 'project-1',
        ownerId: 'anon',
        name: 'sneaky',
      }),
    ).rejects.toThrow('not authenticated')
    expect(seenAuthData).toBe(null)
    expect(rows).toEqual([])
  })

  test('binds auth, queries, pipe keys, effects, and direct execution structurally', async () => {
    const rows: ProjectRow[] = []
    let mutationRuns = 0
    let validatedMutationAuth: string | undefined
    let validatedQueryAuth: string | undefined
    let barrierRuns = 0
    let backgroundRuns = 0
    let backgroundAuth: string | undefined

    const bindings = createZeroServerBindings({
      schema,
      models: {
        project: {
          mutate: {
            create: async (
              { authData, server, tx }: MutatorContext,
              value: ProjectRow,
            ) => {
              mutationRuns++
              expect(authData?.id).toBe('user-1')
              await tx.mutate.project.insert(value)
              server?.enqueueTask(
                async () => {
                  barrierRuns++
                },
                { barrier: true },
              )
              server?.enqueueTask(async () => {
                backgroundRuns++
                backgroundAuth = getScopedAuthData()?.id as string | undefined
              })
            },
          },
        },
      },
      createServerActions: () => ({}),
      queries,
      validateMutation({ authData }) {
        validatedMutationAuth = authData?.id as string | undefined
      },
      validateQuery({ authData }) {
        validatedQueryAuth = authData?.id as string | undefined
      },
    })

    expect(Object.keys(bindings.mutators)).toEqual(['project|create'])
    const { executor, scheduledBackground } = createTestExecutor(bindings.mutators, rows)
    const server = bindings.server(executor)
    await server.mutate.project.create(
      { id: 'project-1', ownerId: 'user-1', name: 'first' },
      { authData: { id: 'user-1' } },
    )

    expect(rows).toEqual([{ id: 'project-1', ownerId: 'user-1', name: 'first' }])
    expect(mutationRuns).toBe(1)
    expect(validatedMutationAuth).toBe('user-1')
    expect(barrierRuns).toBe(1)
    await Promise.all(scheduledBackground)
    expect(backgroundRuns).toBe(1)
    expect(backgroundAuth).toBe('user-1')

    const claims = authDataToClaims({ id: 'user-1' })
    const ast = await bindings.resolveQuery(
      'project|byOwner',
      [{ ownerId: 'user-1' }],
      claims,
    )
    expect(JSON.stringify(ast)).toContain('ownerId')
    expect(JSON.stringify(ast)).toContain('user-1')
    expect(validatedQueryAuth).toBe('user-1')
  })
})
