import { DatabaseSync, type SQLInputValue } from 'node:sqlite'

import { boolean, createSchema, json, relationships, string, table } from '@rocicorp/zero'
import { asQueryInternals } from '@rocicorp/zero/bindings'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { createZeroSQLiteServer } from './createZeroSQLiteServer'
import { zeroHttpFixtureSchema } from './httpPull/fixtureSchema'

import type {
  SqlStatementMetadata,
  SQLiteTransactionExecutor,
  SQLiteTransactionProvider,
} from './createZeroSQLiteServer'

const note = table('note')
  .from('note_records')
  .columns({
    id: string().from('note_id'),
    done: boolean(),
    data: json<{ label: string }>().optional(),
  })
  .primaryKey('id')

const sqliteTypesSchema = createSchema({
  tables: [note],
  relationships: [],
  enableLegacyQueries: true,
})

const person = table('person').columns({ id: string() }).primaryKey('id')
const membership = table('membership')
  .columns({ personId: string(), teamId: string() })
  .primaryKey('personId', 'teamId')
const team = table('team')
  .from('team_records')
  .columns({
    id: string().from('team_id'),
    active: boolean().from('is_active'),
    metadata: json<{ label: string }>().from('metadata_json'),
  })
  .primaryKey('id')
const twoHopSchema = createSchema({
  tables: [person, membership, team],
  relationships: [
    relationships(person, ({ many }) => ({
      teams: many(
        {
          sourceField: ['id'],
          destSchema: membership,
          destField: ['personId'],
        },
        {
          sourceField: ['teamId'],
          destSchema: team,
          destField: ['id'],
        },
      ),
    })),
  ],
})

function pushRequest(id: number, name: string, args: unknown) {
  return new Request('http://localhost/push?schema=zero_0&appID=zero', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      clientGroupID: 'cg1',
      mutations: [
        {
          type: 'custom',
          id,
          clientID: 'client-a',
          name,
          args: [args],
          timestamp: 1,
        },
      ],
      pushVersion: 1,
      timestamp: 1,
      requestID: 'req-' + id,
    }),
  })
}

function cleanupRequest() {
  return new Request('http://localhost/push?schema=zero_0&appID=zero', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      clientGroupID: 'cg1',
      mutations: [
        {
          type: 'custom',
          id: 2,
          clientID: 'client-a',
          name: '_zero_cleanupResults',
          args: [
            {
              clientGroupID: 'cg1',
              clientID: 'client-a',
              upToMutationID: 1,
            },
          ],
          timestamp: 1,
        },
      ],
      pushVersion: 1,
      timestamp: 1,
      requestID: 'cleanup',
    }),
  })
}

describe('createZeroSQLiteServer', () => {
  let db: DatabaseSync
  let retryNextTransaction: boolean
  let transactionProvider: SQLiteTransactionProvider
  let statements: SqlStatementMetadata[]

  beforeEach(() => {
    db = new DatabaseSync(':memory:')
    db.exec(
      [
        'CREATE TABLE project (id TEXT PRIMARY KEY, ownerId TEXT NOT NULL, name TEXT NOT NULL);',
        'CREATE TABLE note_records (note_id TEXT PRIMARY KEY, done INTEGER NOT NULL, data TEXT);',
      ].join('\n'),
    )

    retryNextTransaction = false
    statements = []
    const executor: SQLiteTransactionExecutor = {
      async exec(sql, params = [], metadata) {
        if (metadata) statements.push(metadata)
        const result = db.prepare(sql).run(...(params as SQLInputValue[]))
        return { changes: Number(result.changes) }
      },
      async query<Row extends Record<string, unknown>>(sql, params = []) {
        return db.prepare(sql).all(...(params as SQLInputValue[])) as Row[]
      },
      async queryAst<Result>(ast, format) {
        let rows: Record<string, unknown>[]
        if (ast.table === 'project') {
          rows = db.prepare('SELECT * FROM project ORDER BY id').all()
        } else if (ast.table === 'note') {
          rows = db
            .prepare('SELECT note_id, done, data FROM note_records ORDER BY note_id')
            .all()
            .map((row) => ({
              id: row.note_id,
              done: row.done !== 0,
              data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
            }))
        } else if (ast.table === 'person') {
          rows = [
            {
              id: 'p1',
              teams: [
                {
                  id: 't1',
                  active: true,
                  metadata: { label: 'core' },
                },
              ],
            },
          ]
        } else {
          throw new Error('unexpected table ' + ast.table)
        }
        return (format.singular ? rows[0] : rows) as Result
      },
    }
    const run = async <R>(
      callback: (tx: SQLiteTransactionExecutor) => R | Promise<R>,
    ) => {
      db.exec('BEGIN')
      try {
        const value = await callback(executor)
        db.exec('COMMIT')
        return value
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    }
    transactionProvider = async <R>(
      callback: (tx: SQLiteTransactionExecutor) => R | Promise<R>,
    ) => {
      if (retryNextTransaction) {
        retryNextTransaction = false
        db.exec('BEGIN')
        await callback(executor)
        db.exec('ROLLBACK')
      }
      return run(callback)
    }
  })

  afterEach(() => {
    db.close()
  })

  test('commits CRUD, the mutation ledger, and one retry-safe async task', async () => {
    let effectRuns = 0
    const server = createZeroSQLiteServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            create: async ({ tx, server }, value: Record<string, unknown>) => {
              await tx.mutate.project.insert(value as never)
              server?.asyncTasks.push(async () => {})
              expect(server?.asyncTasks).toHaveLength(1)
              server?.asyncTasks.splice(0, 1, async () => {})
              server!.asyncTasks[0] = async () => {
                effectRuns++
              }
            },
          },
        },
      },
      createServerActions: () => ({}),
      transactionProvider,
    })

    retryNextTransaction = true
    const result = await server.handleMutationRequest({
      authData: null,
      request: pushRequest(1, 'project.create', {
        id: 'p1',
        ownerId: 'u1',
        name: 'first',
      }),
      skipAsyncTasks: true,
    })

    expect((result.response as any).mutations[0].result).toEqual({})
    expect(db.prepare('SELECT * FROM project').all()).toEqual([
      { id: 'p1', ownerId: 'u1', name: 'first' },
    ])
    expect(db.prepare('SELECT * FROM zero_0_clients').all()).toEqual([
      { clientGroupID: 'cg1', clientID: 'client-a', lastMutationID: 1 },
    ])
    expect(result.asyncTasks).toHaveLength(1)
    await result.asyncTasks[0]!()
    expect(effectRuns).toBe(1)
  })

  test('rolls back row writes and persists an application error with its LMID', async () => {
    const server = createZeroSQLiteServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            fail: async ({ tx }, value: Record<string, unknown>) => {
              await tx.mutate.project.insert(value as never)
              throw new Error('rejected')
            },
          },
        },
      },
      createServerActions: () => ({}),
      transactionProvider,
    })

    const result = await server.handleMutationRequest({
      authData: null,
      request: pushRequest(1, 'project.fail', {
        id: 'p1',
        ownerId: 'u1',
        name: 'first',
      }),
    })

    expect((result.response as any).mutations[0].result).toMatchObject({
      error: 'app',
      message: 'rejected',
    })
    expect(db.prepare('SELECT * FROM project').all()).toEqual([])
    expect(db.prepare('SELECT lastMutationID FROM zero_0_clients').get()).toEqual({
      lastMutationID: 1,
    })
    const stored = db.prepare('SELECT result FROM zero_0_mutations').get() as {
      result: string
    }
    expect(JSON.parse(stored.result)).toMatchObject({
      error: 'app',
      message: 'rejected',
    })
  })

  test('recovers duplicate results and deletes them through the cleanup mutation', async () => {
    const server = createZeroSQLiteServer({
      schema: zeroHttpFixtureSchema,
      models: {
        project: {
          mutate: {
            create: async ({ tx }, value: Record<string, unknown>) => {
              await tx.mutate.project.insert(value as never)
            },
          },
        },
      },
      createServerActions: () => ({}),
      transactionProvider,
    })
    const value = {
      id: 'p1',
      ownerId: 'u1',
      name: 'first',
    }

    await server.handleMutationRequest({
      authData: null,
      request: pushRequest(1, 'project.create', value),
    })
    const duplicate = await server.handleMutationRequest({
      authData: null,
      request: pushRequest(1, 'project.create', value),
    })

    expect((duplicate.response as any).mutations[0].result).toMatchObject({
      error: 'alreadyProcessed',
    })
    expect(db.prepare('SELECT lastMutationID FROM zero_0_clients').get()).toEqual({
      lastMutationID: 1,
    })
    expect(db.prepare('SELECT COUNT(*) AS count FROM zero_0_mutations').get()).toEqual({
      count: 1,
    })

    await server.handleMutationRequest({
      authData: null,
      request: cleanupRequest(),
    })
    expect(db.prepare('SELECT COUNT(*) AS count FROM zero_0_mutations').get()).toEqual({
      count: 0,
    })
  })

  test('supports direct CRUD, server names, value codecs, and query AST execution', async () => {
    const server = createZeroSQLiteServer({
      schema: sqliteTypesSchema,
      models: {
        note: {
          mutate: {
            insert: async ({ tx }, value: Record<string, unknown>) => {
              await tx.mutate.note.insert(value as never)
            },
            upsert: async ({ tx }, value: Record<string, unknown>) => {
              await tx.mutate.note.upsert(value as never)
            },
            update: async ({ tx }, value: Record<string, unknown>) => {
              await tx.mutate.note.update(value as never)
            },
            delete: async ({ tx }, value: Record<string, unknown>) => {
              await tx.mutate.note.delete(value as never)
            },
          },
        },
      },
      createServerActions: () => ({}),
      transactionProvider,
    })

    await server.mutate.note.insert({
      id: 'n1',
      done: false,
      data: { label: 'first' },
    })
    await server.mutate.note.upsert({
      id: 'n1',
      done: true,
      data: { label: 'second' },
    })
    await server.mutate.note.update({
      id: 'n1',
      done: false,
    })

    expect(db.prepare('SELECT * FROM note_records').get()).toEqual({
      note_id: 'n1',
      done: 0,
      data: JSON.stringify({ label: 'second' }),
    })
    await expect(server.query((q) => q.note)).resolves.toEqual([
      {
        id: 'n1',
        done: false,
        data: { label: 'second' },
      },
    ])
    await server.transaction(async (tx) => {
      if (tx.location !== 'server') throw new Error('expected server transaction')
      await expect((tx.query as any).note.one().run()).resolves.toEqual({
        id: 'n1',
        done: false,
        data: { label: 'second' },
      })
      await expect(
        tx.dbTransaction.query('SELECT * FROM note_records', []),
      ).resolves.toEqual([
        {
          note_id: 'n1',
          done: 0,
          data: JSON.stringify({ label: 'second' }),
        },
      ])
    })

    await server.mutate.note.delete({ id: 'n1' })
    expect(db.prepare('SELECT * FROM note_records').all()).toEqual([])
    expect(statements).toEqual([
      { table: 'note_records', publicTable: 'note', kind: 'insert' },
      { table: 'note_records', publicTable: 'note', kind: 'upsert' },
      { table: 'note_records', publicTable: 'note', kind: 'update' },
      { table: 'note_records', publicTable: 'note', kind: 'delete' },
    ])
  })

  test('decodes destination rows through a hidden two-hop junction', async () => {
    const server = createZeroSQLiteServer({
      schema: twoHopSchema,
      models: {},
      createServerActions: () => ({}),
      transactionProvider,
    })

    await expect(server.query((q: any) => q.person.related('teams'))).resolves.toEqual([
      {
        id: 'p1',
        teams: [
          {
            id: 't1',
            active: true,
            metadata: { label: 'core' },
          },
        ],
      },
    ])
  })

  test('accepts a hydrated singular query result from the transaction executor', async () => {
    const hydrated = {
      id: 'n1',
      done: false,
      data: { label: 'already decoded' },
    }
    let receivedQueryName: string | undefined
    const hydratedExecutor = {
      async exec() {
        return { changes: 0 }
      },
      async query() {
        return []
      },
      async queryAst(_ast: unknown, _format: unknown, queryName?: string) {
        receivedQueryName = queryName
        return hydrated
      },
    } as unknown as SQLiteTransactionExecutor
    const hydratedProvider: SQLiteTransactionProvider = async (callback) =>
      callback(hydratedExecutor)
    const server = createZeroSQLiteServer({
      schema: sqliteTypesSchema,
      models: {},
      createServerActions: () => ({}),
      transactionProvider: hydratedProvider,
    })

    await expect(
      server.query((q) => asQueryInternals(q.note.one()).nameAndArgs('noteByID', ['n1'])),
    ).resolves.toEqual(hydrated)
    expect(receivedQueryName).toBe('noteByID')
  })
})
