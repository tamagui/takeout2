import { and, eq, gt, gte, lt, lte, ne } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { PgTimestampString } from 'drizzle-orm/pg-core'

import type { InferInsertModel, SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { Pool } from 'pg'

// zero uses epoch-ms numbers for timestamps, drizzle v2 only accepts string|Date.
// patch once here so every pg.insert/update handles numbers automatically.
let patched = false
function patchTimestampForZero() {
  if (patched) return
  patched = true
  const orig = PgTimestampString.prototype.mapToDriverValue
  PgTimestampString.prototype.mapToDriverValue = function (value: any) {
    if (typeof value === 'number') return new Date(value).toISOString()
    return orig.call(this, value)
  }
}

const operators = { eq, ne, lt, lte, gt, gte } as const
type Op = keyof typeof operators

type WhereOp = Partial<Record<Op, any>>
type WhereValue = string | number | boolean | null | WhereOp

type WithSQL<T> = { [K in keyof T]: T[K] | SQL }

type TableName<TSchema> = {
  [K in keyof TSchema]: TSchema[K] extends PgTable ? K : never
}[keyof TSchema]

type WhereClause<TSchema, T extends TableName<TSchema>> = Partial<
  Record<
    keyof InferInsertModel<TSchema[T] extends PgTable ? TSchema[T] : never> & string,
    WhereValue
  >
>

type InsertMap<TSchema> = {
  [K in TableName<TSchema>]: Partial<
    WithSQL<InferInsertModel<TSchema[K] extends PgTable ? TSchema[K] : never>>
  >
}

function resolveWhere(table: any, where: Record<string, WhereValue>) {
  const conditions = Object.entries(where).map(([key, value]) => {
    if (value !== null && typeof value === 'object') {
      const entries = Object.entries(value) as [Op, any][]
      if (entries.length === 1) {
        return operators[entries[0]![0]](table[key], entries[0]![1])
      }
      return and(...entries.map(([op, v]) => operators[op](table[key], v)))!
    }
    return eq(table[key], value)
  })
  return conditions.length === 1 ? conditions[0]! : and(...conditions)!
}

export type CreateDrizzleOptions<TSchema extends Record<string, unknown>> = {
  pool: Pool
  schema: TSchema
  relations?: any
}

export function createDrizzle<TSchema extends Record<string, unknown>>(
  options: CreateDrizzleOptions<TSchema>,
) {
  patchTimestampForZero()

  const instance = drizzle({
    client: options.pool,
    schema: options.schema as any,
    relations: options.relations,
    logger: false,
  } as any)

  const helpers = {
    insertRow<T extends TableName<TSchema>>(tableName: T, values: InsertMap<TSchema>[T]) {
      const table = options.schema[tableName]
      return instance.insert(table as any).values(values as any)
    },

    updateRow<T extends TableName<TSchema>>(
      tableName: T,
      where: WhereClause<TSchema, T>,
      set: InsertMap<TSchema>[T],
    ) {
      const table = options.schema[tableName]
      return instance
        .update(table as any)
        .set(set as any)
        .where(resolveWhere(table, where as Record<string, WhereValue>))
    },

    deleteRow<T extends TableName<TSchema>>(
      tableName: T,
      where: WhereClause<TSchema, T>,
    ) {
      const table = options.schema[tableName]
      return instance
        .delete(table as any)
        .where(resolveWhere(table, where as Record<string, WhereValue>))
    },
  }

  return Object.assign(instance, helpers)
}
