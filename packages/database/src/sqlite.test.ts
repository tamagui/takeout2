import { Database } from 'bun:sqlite'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterEach, describe, expect, test } from 'bun:test'

import {
  createBunSQLiteExecutor,
  createBunSQLiteTransactionProvider,
  createSQLiteDatabase,
} from './sqlite'

const todo = sqliteTable('todo', {
  id: integer().primaryKey(),
  title: text().notNull(),
})

async function unavailableQueryAst<Result>(): Promise<Result> {
  throw new Error('queryAst is not used by this Drizzle test')
}

describe('createSQLiteDatabase', () => {
  const databases: Database[] = []

  afterEach(() => {
    for (const database of databases.splice(0)) database.close()
  })

  test('creates typed Drizzle inside the provider-owned Bun transaction', async () => {
    const native = new Database(':memory:')
    databases.push(native)
    native.exec('CREATE TABLE todo (id INTEGER PRIMARY KEY, title TEXT NOT NULL)')
    const database = createSQLiteDatabase({
      schema: { todo },
      transactionProvider: createBunSQLiteTransactionProvider({
        database: native,
        queryAst: unavailableQueryAst,
      }),
    })

    await database.transaction(async ({ drizzle }) => {
      await drizzle.insert(todo).values({ id: 1, title: 'first' }).run()
      await drizzle.insert(todo).values({ id: 2, title: 'second' }).run()
    })

    await expect(
      database.transaction(async ({ drizzle }) =>
        drizzle.select().from(todo).orderBy(todo.id),
      ),
    ).resolves.toEqual([
      { id: 1, title: 'first' },
      { id: 2, title: 'second' },
    ])

    await expect(
      database.transaction(async ({ drizzle }) => drizzle.select().from(todo).get()),
    ).resolves.toEqual({ id: 1, title: 'first' })
  })

  test('uses a remote owner transaction without sqlite-proxy transaction SQL', async () => {
    const native = new Database(':memory:')
    databases.push(native)
    native.exec('CREATE TABLE todo (id INTEGER PRIMARY KEY, title TEXT NOT NULL)')
    const executor = createBunSQLiteExecutor({
      database: native,
      queryAst: unavailableQueryAst,
    })
    let transactions = 0
    const database = createSQLiteDatabase({
      schema: { todo },
      transactionProvider: async (work) => {
        transactions++
        native.exec('BEGIN')
        try {
          const value = await work(executor)
          native.exec('COMMIT')
          return value
        } catch (error) {
          native.exec('ROLLBACK')
          throw error
        }
      },
    })

    await database.transaction(async ({ drizzle }) => {
      await drizzle.insert(todo).values({ id: 1, title: 'remote' }).run()
    })

    expect(transactions).toBe(1)
    expect(native.prepare('SELECT * FROM todo').all()).toEqual([
      { id: 1, title: 'remote' },
    ])
  })

  test('rolls back a failed provider callback', async () => {
    const native = new Database(':memory:')
    databases.push(native)
    native.exec('CREATE TABLE todo (id INTEGER PRIMARY KEY, title TEXT NOT NULL)')
    const database = createSQLiteDatabase({
      schema: { todo },
      transactionProvider: createBunSQLiteTransactionProvider({
        database: native,
        queryAst: unavailableQueryAst,
      }),
    })

    await expect(
      database.transaction(async ({ drizzle }) => {
        await drizzle.insert(todo).values({ id: 1, title: 'rolled back' }).run()
        throw new Error('reject')
      }),
    ).rejects.toThrow('reject')

    await expect(
      database.transaction(async ({ drizzle }) => drizzle.select().from(todo)),
    ).resolves.toEqual([])
  })
})
