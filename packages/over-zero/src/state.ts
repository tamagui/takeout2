import { createBuilder, type Schema } from '@rocicorp/zero'
import type { AuthData, QueryBuilder } from './types'

let schema: Schema | null = null
let zql: QueryBuilder | null = null
let authData: AuthData | null | undefined

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
  zql = createBuilder(_)
}

export const getAuthData = () => {
  if (authData === undefined) throw new Error(errMessage)
  return authData
}

export const setAuthData = (_: AuthData) => {
  authData = _
}
