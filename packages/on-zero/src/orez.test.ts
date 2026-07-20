import { DatabaseSync, type SQLInputValue } from 'node:sqlite'

import { createSchema, defineQueries, defineQuery, string, table } from '@rocicorp/zero'
import {
  createSyncExecutor,
  type ApplicationDatabase,
  type ApplicationTransaction,
} from 'orez/sync-executor'
import * as v from 'valibot'
import { afterEach, describe, expect, test } from 'vitest'

import { authDataToClaims, createOrezBindings } from './orez'
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

describe('createOrezBindings', () => {
  const databases: DatabaseSync[] = []

  afterEach(() => {
    while (databases.length) databases.pop()!.close()
  })

  test('an anonymous push keeps authData null so auth-required mutators reject', async () => {
    const sqlite = new DatabaseSync(':memory:')
    databases.push(sqlite)
    sqlite.exec(
      'CREATE TABLE project (id TEXT PRIMARY KEY, ownerId TEXT NOT NULL, name TEXT NOT NULL)',
    )

    let seenAuthData: AuthData | null | undefined
    const bindings = createOrezBindings({
      schema,
      models: {
        project: {
          mutate: {
            create: async (
              { authData, tx }: MutatorContext,
              value: { id: string; ownerId: string; name: string },
            ) => {
              seenAuthData = authData
              // the guard every takeout mutation relies on
              if (!authData) throw new Error('not authenticated')
              await tx.mutate.project.insert(value)
            },
          },
        },
      },
      createServerActions: () => ({}),
      queries,
    })

    const executor = createSyncExecutor({
      database: sqliteApplicationDatabase(sqlite),
      schema,
      mutators: bindings.mutators,
      effects: {
        runBackground(promise) {
          void promise
        },
        report(error) {
          throw error
        },
      },
    })

    const result = await executor.push(
      {
        clientGroupID: 'group-anon',
        mutations: [
          {
            type: 'custom',
            id: 1,
            clientID: 'client-anon',
            name: 'project|create',
            args: [{ id: 'project-1', ownerId: 'anon', name: 'sneaky' }],
            timestamp: 1,
          },
        ],
        pushVersion: 1,
        requestID: 'request-anon',
      },
      authDataToClaims(null),
    )

    expect(seenAuthData).toBe(null)
    expect(result.pushResponse).toMatchObject({
      mutations: [{ result: { error: 'app', message: 'not authenticated' } }],
    })
    expect(sqlite.prepare('SELECT * FROM project').all()).toEqual([])
  })

  test('binds auth, queries, pipe keys, effects, and replay to one Orez executor', async () => {
    const sqlite = new DatabaseSync(':memory:')
    databases.push(sqlite)
    sqlite.exec(
      'CREATE TABLE project (id TEXT PRIMARY KEY, ownerId TEXT NOT NULL, name TEXT NOT NULL)',
    )

    let mutationRuns = 0
    let validatedMutationAuth: string | undefined
    let validatedQueryAuth: string | undefined
    let barrierRuns = 0
    let backgroundRuns = 0
    let backgroundAuth: string | undefined
    const scheduledBackground: Promise<void>[] = []

    const bindings = createOrezBindings({
      schema,
      models: {
        project: {
          mutate: {
            create: async (
              { authData, server, tx }: MutatorContext,
              value: { id: string; ownerId: string; name: string },
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

    const executor = createSyncExecutor({
      database: sqliteApplicationDatabase(sqlite),
      schema,
      mutators: bindings.mutators,
      effects: {
        runBackground(promise) {
          scheduledBackground.push(promise)
        },
        report(error) {
          throw error
        },
      },
    })
    const claims = authDataToClaims({ id: 'user-1', role: 'member' } as AuthData)
    const body = {
      clientGroupID: 'group-1',
      mutations: [
        {
          type: 'custom',
          id: 1,
          clientID: 'client-1',
          name: 'project|create',
          args: [{ id: 'project-1', ownerId: 'user-1', name: 'first' }],
          timestamp: 1,
        },
      ],
      pushVersion: 1,
      requestID: 'request-1',
    }

    const first = await executor.push(body, claims)
    expect(first.pushResponse).toMatchObject({
      mutations: [{ result: {} }],
    })
    expect(sqlite.prepare('SELECT * FROM project').all()).toEqual([
      { id: 'project-1', ownerId: 'user-1', name: 'first' },
    ])
    expect(mutationRuns).toBe(1)
    expect(validatedMutationAuth).toBe('user-1')
    expect(barrierRuns).toBe(1)
    await Promise.all(scheduledBackground)
    expect(backgroundRuns).toBe(1)
    expect(backgroundAuth).toBe('user-1')

    const replay = await executor.push(body, claims)
    expect(replay.pushResponse).toMatchObject({
      mutations: [{ result: { error: 'alreadyProcessed' } }],
    })
    expect(scheduledBackground).toHaveLength(1)
    expect(mutationRuns).toBe(1)
    expect(barrierRuns).toBe(1)
    expect(backgroundRuns).toBe(1)

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

function sqliteApplicationDatabase(sqlite: DatabaseSync): ApplicationDatabase {
  const applicationTransaction: ApplicationTransaction = {
    async exec(sql, params = []) {
      const result = sqlite.prepare(sql).run(...(params as SQLInputValue[]))
      return { changes: Number(result.changes) }
    },
    async query<Row extends Record<string, unknown>>(sql: string, params = []) {
      return sqlite.prepare(sql).all(...(params as SQLInputValue[])) as Row[]
    },
    async queryAst<Result>() {
      return [] as Result
    },
  }

  return {
    dialect: 'sqlite',
    async transaction(work) {
      sqlite.exec('BEGIN')
      try {
        const value = await work(applicationTransaction)
        sqlite.exec('COMMIT')
        return value
      } catch (error) {
        sqlite.exec('ROLLBACK')
        throw error
      }
    },
    async query<Row extends Record<string, unknown>>(sql: string, params = []) {
      return sqlite.prepare(sql).all(...(params as SQLInputValue[])) as Row[]
    },
  }
}
