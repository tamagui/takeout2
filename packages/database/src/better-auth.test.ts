import { Database } from 'bun:sqlite'

import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterEach, describe, expect, test } from 'bun:test'

import { createBetterAuthSQLiteAdapter } from './better-auth'
import {
  createBunSQLiteTransactionProvider,
  type SQLiteTransactionProvider,
} from './sqlite'

const user = sqliteTable('user', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: 'boolean' }).notNull(),
  image: text(),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull(),
})

const account = sqliteTable('account', {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  password: text(),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull(),
})

type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

async function unavailableQueryAst<Result>(): Promise<Result> {
  throw new Error('queryAst is not used by Better Auth')
}

describe('createBetterAuthSQLiteAdapter', () => {
  const databases: Database[] = []

  afterEach(() => {
    for (const database of databases.splice(0)) database.close()
  })

  function setup() {
    const database = new Database(':memory:')
    databases.push(database)
    database.exec('PRAGMA foreign_keys = ON')
    database.exec(`
      CREATE TABLE user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailVerified INTEGER NOT NULL,
        image TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE TABLE account (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        password TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `)
    const nativeProvider = createBunSQLiteTransactionProvider({
      database,
      queryAst: unavailableQueryAst,
    })
    let providerCalls = 0
    const transactionProvider: SQLiteTransactionProvider = (work) => {
      providerCalls++
      return nativeProvider(work)
    }
    const adapterFactory = createBetterAuthSQLiteAdapter({
      schema: { account, user },
      transactionProvider,
    })
    const authOptions = {
      baseURL: 'http://localhost',
      database: adapterFactory,
      emailAndPassword: { enabled: true },
    } satisfies BetterAuthOptions
    const auth = betterAuth(authOptions)

    return {
      adapter: adapterFactory(authOptions),
      auth,
      database,
      providerCalls: () => providerCalls,
    }
  }

  test('rolls back a signup-like user and credential transaction', async () => {
    const { adapter, auth, database, providerCalls } = setup()
    expect(typeof auth.handler).toBe('function')

    await expect(
      adapter.transaction(async (transaction) => {
        const created = await transaction.create<User>({
          model: 'user',
          data: {
            name: 'Ada',
            email: 'ada@example.com',
            emailVerified: false,
            createdAt: new Date(1_700_000_000_000),
            updatedAt: new Date(1_700_000_000_000),
          },
        })
        await transaction.create({
          model: 'account',
          data: {
            accountId: 'ada@example.com',
            providerId: 'credential',
            userId: created.id,
            password: 'hash',
            createdAt: new Date(1_700_000_000_000),
            updatedAt: new Date(1_700_000_000_000),
          },
        })
        throw new Error('signup rejected')
      }),
    ).rejects.toThrow('signup rejected')

    expect(providerCalls()).toBe(1)
    expect(database.prepare('SELECT * FROM user').all()).toEqual([])
    expect(database.prepare('SELECT * FROM account').all()).toEqual([])
  })

  test('returns affected row counts for standalone update and delete operations', async () => {
    const { adapter, database, providerCalls } = setup()

    await adapter.transaction(async (transaction) => {
      for (const email of ['a@example.com', 'b@example.com', 'other@test.com']) {
        await transaction.create<User>({
          model: 'user',
          data: {
            name: email,
            email,
            emailVerified: false,
            createdAt: new Date(1_700_000_000_000),
            updatedAt: new Date(1_700_000_000_000),
          },
        })
      }
    })

    await expect(
      adapter.updateMany({
        model: 'user',
        where: [{ field: 'email', operator: 'ends_with', value: '@example.com' }],
        update: { emailVerified: true },
      }),
    ).resolves.toBe(2)
    await expect(
      adapter.deleteMany({
        model: 'user',
        where: [{ field: 'email', value: 'other@test.com' }],
      }),
    ).resolves.toBe(1)

    expect(providerCalls()).toBe(3)
    expect(
      database.prepare('SELECT email, emailVerified FROM user ORDER BY email').all(),
    ).toEqual([
      { email: 'a@example.com', emailVerified: 1 },
      { email: 'b@example.com', emailVerified: 1 },
    ])
  })
})
