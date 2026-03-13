import { createBuilder, type Schema } from '@rocicorp/zero'
import { globalValue } from '@take-out/helpers'

import type { AuthData, QueryBuilder } from './types'

type State = {
  schema: Schema | null
  zql: QueryBuilder | null
  authData: AuthData | null | undefined
  environment: 'client' | 'server' | null
}

const getState = () =>
  globalValue<State>('on-zero:state', () => ({
    schema: null,
    zql: null,
    authData: undefined,
    environment: null,
  }))

const errMessage = `Haven't called createZeroClient or createZeroServer yet!`

export const getZQL = () => {
  const { zql } = getState()
  if (!zql) throw new Error(errMessage)
  return zql
}

export const getSchema = () => {
  const { schema } = getState()
  if (!schema) throw new Error(errMessage)
  return schema
}

export const setSchema = (_: Schema) => {
  const state = getState()
  state.schema = _
  state.zql = createBuilder(_) as QueryBuilder
}

export const getAuthData = () => {
  return getState().authData || null
}

export const setAuthData = (_: AuthData) => {
  getState().authData = _
}

export const getEnvironment = () => getState().environment

export const setEnvironment = (env: 'client' | 'server') => {
  getState().environment = env
}
