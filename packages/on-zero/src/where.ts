import { isServer } from './constants'
import { getQueryOrMutatorAuthData } from './helpers/getQueryOrMutatorAuthData'

import type { TableName, Where } from './types'
import type { Condition, ExpressionBuilder } from '@rocicorp/zero'

// when true, serverWhere bypasses the client no-op so nested serverWhere
// calls inside permission builders actually evaluate on the client
let _evaluatingPermission = false

export function setEvaluatingPermission(value: boolean) {
  _evaluatingPermission = value
}

export function where<Table extends TableName, Builder extends Where<Table>>(
  tableName: Table,
  builder: Builder,
  isServerOnly?: boolean
): Where<Table, Condition>

export function where<Table extends TableName, Builder extends Where = Where<Table>>(
  builder: Builder
): Where<Table, Condition>

export function where<Table extends TableName, Builder extends Where<Table>>(
  a: Table | Builder,
  b?: Builder,
  isServerOnly = false
): Where<Table, any> | Builder {
  const whereFn = (b || a) as any

  const wrappedWhereFn = ((
    a: ExpressionBuilder<any, any>,
    b = getQueryOrMutatorAuthData()
  ) => {
    if (!isServer && isServerOnly && !_evaluatingPermission) {
      // on client (web or native) where conditions always pass
      return a.and()
    }

    const result = whereFn(a, b)
    if (typeof result === 'boolean') {
      if (result) {
        return a.cmpLit(0, '=', 0)
      } else {
        return a.cmpLit(1, '=', 0)
      }
    }
    return result
  }) as Builder

  // store the raw (unwrapped) builder so permission checks can evaluate it on client
  WhereRawBuilderMap.set(wrappedWhereFn, whereFn)

  if (b) {
    WhereTableNameMap.set(wrappedWhereFn, a as Table)
  }

  return wrappedWhereFn
}

// permissions where:

const WhereTableNameMap = new WeakMap<Where, TableName>()
const WhereRawBuilderMap = new WeakMap<Where, Where>()

export function getWhereTableName(where: Where) {
  return WhereTableNameMap.get(where)
}

// returns the raw builder that always evaluates (bypasses serverWhere client no-op)
export function getRawWhere(where: Where): Where | undefined {
  return WhereRawBuilderMap.get(where)
}
