import { createBuilder, type Schema } from '@rocicorp/zero'

import type { Context, QueryBuilder } from './types'

let schema: Schema | null = null
let zql: QueryBuilder | null = null
let ctx: Context | undefined
const defaultContext = { auth: null } as Context

const errMessage = `Haven't called createZeroClient or createZeroServer yet!`

export const getZQL = () => {
  if (!zql) throw new Error(errMessage)
  return zql
}

export const getSchema = () => {
  if (!schema) throw new Error(errMessage)
  return schema
}

export const setSchema = (_: Schema) => {
  schema = _
  zql = createBuilder(_) as QueryBuilder
}

export const getContext = (): Context => {
  if (ctx) return ctx
  return defaultContext
}

export const setContext = (_: Context) => {
  ctx = _
}
