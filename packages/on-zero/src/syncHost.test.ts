import { DatabaseSync, type SQLInputValue } from 'node:sqlite'

import { defineQueries, defineQuery } from '@rocicorp/zero'
import * as v from 'valibot'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { getScopedAuthData } from './helpers/mutatorContext'
import { zeroHttpFixtureSchema } from './httpPull/fixtureSchema'
import { createZeroSyncHostAdapter } from './syncHost'
import { zql } from './zql'

import type { SqlStatementMetadata, SQLiteQueryFormat } from './createZeroSQLiteServer'
import type {
  SyncHostApplicationTransaction,
  SyncHostMutatorContext,
  SyncHostTransactionExecutor,
} from './syncHost'

const queries = defineQueries({
  project: {
    byOwner: defineQuery(v.object({ ownerId: v.string() }), ({ args }) =>
      zql.project.where('ownerId', args.ownerId),
    ),
  },
})

describe('createZeroSyncHostAdapter', () => {
  let db: DatabaseSync
  let executor: SyncHostTransactionExecutor
  let transaction: SyncHostApplicationTransaction
  let lastQueryFormat: SQLiteQueryFormat | undefined
  let statements: SqlStatementMetadata[]

  beforeEach(() => {
    db = new DatabaseSync(':memory:')
    db.exec(
      'CREATE TABLE project (id TEXT PRIMARY KEY, ownerId TEXT NOT NULL, name TEXT NOT NULL)',
    )
    statements = []
    executor = {
      exec(sql, params = [], metadata) {
        if (metadata) statements.push(metadata)
        const result = db.prepare(sql).run(...(params as SQLInputValue[]))
        return { changes: Number(result.changes) }
      },
      query<Row extends Record<string, unknown>>(sql, params = []) {
        return db.prepare(sql).all(...(params as SQLInputValue[])) as Row[]
      },
      queryAst<Result>(_ast, format) {
        lastQueryFormat = format
        const rows = db.prepare('SELECT * FROM project ORDER BY id').all()
        return (format.singular ? rows[0] : rows) as Result
      },
    }
    transaction = async (work) => {
      const effects: Array<() => void | Promise<void>> = []
      db.exec('BEGIN')
      try {
        const value = await work(executor, {
          defer(effect) {
            effects.push(effect)
          },
        })
        db.exec('COMMIT')
        for (const effect of effects) await effect()
        return value
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    }
  })

  afterEach(() => {
    db.close()
  })

  test('adapts pipe-named mutators, auth, validation, and deferred effects', async () => {
    let effectAuthID: string | undefined
    let validatedAuthID: string | undefined
    const adapter = createZeroSyncHostAdapter({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            create: async ({ authData, server, tx }, value: Record<string, unknown>) => {
              expect(authData?.id).toBe('u1')
              await tx.mutate.project.insert(value as never)
              server?.asyncTasks.push(async () => {
                effectAuthID = getScopedAuthData()?.id as string
              })
            },
          },
        },
      },
      createServerActions: () => ({}),
      queries,
      transaction,
      validateMutation({ authData }) {
        validatedAuthID = authData?.id as string
      },
    })

    expect(Object.keys(adapter.mutators)).toEqual([
      'project|create',
      '_zero_cleanupResults',
    ])
    await transaction((tx, context) =>
      adapter.mutators['project|create']!(
        tx,
        { id: 'p1', ownerId: 'u1', name: 'first' },
        mutationContext(context),
      ),
    )

    expect(db.prepare('SELECT * FROM project').all()).toEqual([
      { id: 'p1', ownerId: 'u1', name: 'first' },
    ])
    expect(validatedAuthID).toBe('u1')
    expect(effectAuthID).toBe('u1')
    expect(statements).toEqual([
      { table: 'project', publicTable: 'project', kind: 'insert' },
    ])
  })

  test('returns a structural application error and drops rolled-back effects', async () => {
    let effectRuns = 0
    const adapter = createZeroSyncHostAdapter({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            reject: async ({ server, tx }, value: Record<string, unknown>) => {
              await tx.mutate.project.insert(value as never)
              server?.asyncTasks.push(async () => {
                effectRuns++
              })
              throw new Error('denied')
            },
          },
        },
      },
      createServerActions: () => ({}),
      transaction,
    })

    const error = await transaction((tx, context) =>
      adapter.mutators['project|reject']!(
        tx,
        { id: 'p1', ownerId: 'u1', name: 'must roll back' },
        mutationContext(context),
      ),
    ).catch((caught) => caught)

    expect(error).toMatchObject({
      name: 'MutationApplicationError',
      message: 'denied',
      details: 'denied',
    })
    expect(db.prepare('SELECT * FROM project').all()).toEqual([])
    expect(effectRuns).toBe(0)
  })

  test('uses the host queryAst compiler surface for direct server queries', async () => {
    db.prepare('INSERT INTO project (id, ownerId, name) VALUES (?, ?, ?)').run(
      'p1',
      'u1',
      'first',
    )
    const adapter = createZeroSyncHostAdapter({
      schema: zeroHttpFixtureSchema,
      models: {},
      createServerActions: () => ({}),
      transaction,
    })

    await expect(adapter.server.query((q) => q.project.one())).resolves.toEqual({
      id: 'p1',
      ownerId: 'u1',
      name: 'first',
    })
    expect(lastQueryFormat).toEqual({ relationships: {}, singular: true })
  })

  test('resolves auth-sensitive named queries and runs query validation', async () => {
    let validation: unknown
    const adapter = createZeroSyncHostAdapter({
      schema: zeroHttpFixtureSchema,
      models: {},
      createServerActions: () => ({}),
      queries,
      transaction,
      validateQuery(args) {
        validation = args
      },
    })

    const ast = await adapter.resolveQuery('project|byOwner', [{ ownerId: 'u1' }], {
      userID: 'u1',
      role: 'member',
    })

    expect(ast).toMatchObject({ table: 'project' })
    expect(JSON.stringify(ast)).toContain('ownerId')
    expect(JSON.stringify(ast)).toContain('u1')
    expect(validation).toEqual({
      authData: { id: 'u1', role: 'member', userID: 'u1' },
      queryName: 'project|byOwner',
      params: { ownerId: 'u1' },
    })
  })
})

function mutationContext(context: {
  defer(effect: () => void | Promise<void>): void
}): SyncHostMutatorContext {
  return {
    ...context,
    claims: { userID: 'u1', role: 'member' },
    clientID: 'client-a',
    mutationID: '1',
  }
}
