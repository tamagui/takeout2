import { and, eq, gt, gte, lt, lte, ne } from 'drizzle-orm'
import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'
import { PgTimestampString } from 'drizzle-orm/pg-core'

import type { AnyRelations, EmptyRelations, InferInsertModel, SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { Pool } from 'pg'

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

export type CreateDrizzleOptions<
  TSchema extends Record<string, unknown>,
  TRelations extends AnyRelations = EmptyRelations,
> = {
  pool: Pool
  schema: TSchema
  relations?: TRelations
}

type ExtractTable<TSchema, T extends TableName<TSchema>> = TSchema[T] extends PgTable
  ? TSchema[T]
  : never

export type DrizzleHelpers<
  TSchema extends Record<string, unknown> = Record<string, unknown>,
  TDb extends NodePgDatabase<any, any> = NodePgDatabase<TSchema>,
> = {
  insertRow<T extends TableName<TSchema>>(
    tableName: T,
    values: InsertMap<TSchema>[T],
  ): ReturnType<ReturnType<TDb['insert']>['values']>
  updateRow<T extends TableName<TSchema>>(
    tableName: T,
    where: WhereClause<TSchema, T>,
    set: InsertMap<TSchema>[T],
  ): ReturnType<ReturnType<ReturnType<TDb['update']>['set']>['where']>
  deleteRow<T extends TableName<TSchema>>(
    tableName: T,
    where: WhereClause<TSchema, T>,
  ): ReturnType<ReturnType<TDb['delete']>['where']>
}

export function createDrizzle<
  TSchema extends Record<string, unknown>,
  TRelations extends AnyRelations = EmptyRelations,
>(
  options: CreateDrizzleOptions<TSchema, TRelations>,
): NodePgDatabase<TSchema, TRelations> &
  DrizzleHelpers<TSchema, NodePgDatabase<TSchema, TRelations>> {
  patchTimestampForZero()

  // drizzle v1 overloads don't support generic schema+relations together at the call site
  const instance = drizzle({
    client: options.pool,
    schema: options.schema as Record<string, unknown>,
    relations: options.relations,
    logger: process.env.DEBUG_SQL === '1',
  } as any) as unknown as NodePgDatabase<TSchema, TRelations>

  const helpers: DrizzleHelpers<TSchema, NodePgDatabase<TSchema, TRelations>> = {
    insertRow(tableName, values) {
      const table = options.schema[tableName] as any
      return instance.insert(table).values(values as Record<string, unknown>)
    },
    updateRow(tableName, where, set) {
      const table = options.schema[tableName] as any
      return instance
        .update(table)
        .set(set as Record<string, unknown>)
        .where(resolveWhere(table, where as Record<string, WhereValue>))
    },
    deleteRow(tableName, where) {
      const table = options.schema[tableName] as any
      return instance
        .delete(table)
        .where(resolveWhere(table, where as Record<string, WhereValue>))
    },
  }

  return Object.assign(instance, helpers)
}
