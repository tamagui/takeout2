import { ellipsis } from '@take-out/helpers'

import type { Pool, QueryResult } from 'pg'

export type SqlQuery = {
  text: string
  values: any[]
}

export const createSql = (pool: Pool) => {
  return (strings: TemplateStringsArray, ...values: any[]): Promise<QueryResult<any>> => {
    const text = strings.reduce((result, str, i) => {
      return result + str + (i < values.length ? `$${i + 1}` : '')
    }, '')

    console.info(`sql: ${ellipsis(text, 80)}`)

    return pool.query(text.trim(), values)
  }
}

// default export for backward compatibility
let defaultPool: Pool | null = null

export const setDefaultPool = (pool: Pool) => {
  defaultPool = pool
}

export const sql = (
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<QueryResult<any>> => {
  if (!defaultPool) {
    throw new Error('No default pool set. Call setDefaultPool() first or use createSql()')
  }
  return createSql(defaultPool)(strings, ...values)
}
