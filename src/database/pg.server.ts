import 'server-only'
import { and, eq, gt, gte, lt, lte, ne } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { PgTimestampString } from 'drizzle-orm/pg-core'
import { database } from './database'
import { relations } from './relations'
import * as schemaPrivate from './schema-private'
import * as schemaPublic from './schema-public'
import type { InferInsertModel, SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'

// zero uses epoch-ms numbers for timestamps, drizzle v2 only accepts string|Date.
// patch once here so every pg.insert/update handles numbers automatically.
const origMapToDriverValue = PgTimestampString.prototype.mapToDriverValue
PgTimestampString.prototype.mapToDriverValue = function (value: any) {
  if (typeof value === 'number') return new Date(value).toISOString()
  return origMapToDriverValue.call(this, value)
}

const schema = {
  ...schemaPublic,
  ...schemaPrivate,
}

const drizzleInstance = drizzle({
  client: database,
  schema,
  relations,
  logger: false,
})

// --- typed helpers ---

type PublicSchema = typeof schemaPublic

type PublicTable = {
  [K in keyof PublicSchema]: PublicSchema[K] extends PgTable ? K : never
}[keyof PublicSchema]

const operators = { eq, ne, lt, lte, gt, gte } as const
type Op = keyof typeof operators

type WhereOp = Partial<Record<Op, any>>
type WhereValue = string | number | boolean | null | WhereOp
type WhereClause<T extends PublicTable> = Partial<
  Record<keyof InferInsertModel<PublicSchema[T]> & string, WhereValue>
>

// allow raw SQL expressions (e.g. sql`...::jsonb`) alongside normal values
type WithSQL<T> = { [K in keyof T]: T[K] | SQL }

type TableInsertMap = {
  [K in PublicTable]: Partial<WithSQL<InferInsertModel<PublicSchema[K]>>>
}

function resolveWhere(table: any, where: Record<string, WhereValue>) {
  const conditions = Object.entries(where).map(([key, value]) => {
    if (value !== null && typeof value === 'object') {
      const entries = Object.entries(value) as [Op, any][]
      if (entries.length === 1) {
        return operators[entries[0][0]](table[key], entries[0][1])
      }
      return and(...entries.map(([op, v]) => operators[op](table[key], v)))!
    }
    return eq(table[key], value)
  })
  return conditions.length === 1 ? conditions[0]! : and(...conditions)!
}

const helpers = {
  insertRow<T extends PublicTable>(tableName: T, values: TableInsertMap[T]) {
    const table = schemaPublic[tableName]
    return drizzleInstance.insert(table).values(values as any)
  },

  updateRow<T extends PublicTable>(
    tableName: T,
    where: WhereClause<T>,
    set: TableInsertMap[T],
  ) {
    const table = schemaPublic[tableName]
    return drizzleInstance
      .update(table)
      .set(set as any)
      .where(resolveWhere(table, where as Record<string, WhereValue>))
  },

  deleteRow<T extends PublicTable>(tableName: T, where: WhereClause<T>) {
    const table = schemaPublic[tableName]
    return drizzleInstance
      .delete(table)
      .where(resolveWhere(table, where as Record<string, WhereValue>))
  },
}

export const pg = Object.assign(drizzleInstance, helpers)

export type Pg = typeof pg
