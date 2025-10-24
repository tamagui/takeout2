import type { QueryResult } from 'pg'
import { database } from './database'
import { ellipsis } from '@vxrn/helpers'

export type SqlQuery = {
  text: string
  values: any[]
}

export const sql = (
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<QueryResult<any>> => {
  const text = strings.reduce((result, str, i) => {
    return result + str + (i < values.length ? `$${i + 1}` : '')
  }, '')

  console.info(`sql: ${ellipsis(text, 80)}`)

  return database.query(text.trim(), values)
}
