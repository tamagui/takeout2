import type { Condition, ExpressionBuilder } from '@rocicorp/zero'
import { globalValue, isClient } from '@vxrn/helpers'
import { getQueryOrMutatorAuthData } from './helpers/getQueryOrMutatorAuthData'
import type { TableName, Where } from './types'

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
    if (isClient && isServerOnly) {
      // on client where conditions always pass
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
  }) as any as Builder

  if (b) {
    WhereTableNameMap.set(wrappedWhereFn, a as Table)
  }

  return wrappedWhereFn
}

// permissions where:

const WhereTableNameMap = globalValue(
  `over-zero:where-table-map`,
  () => new WeakMap<Where, TableName>()
)

export function getWhereTableName(where: Where) {
  return WhereTableNameMap.get(where)
}
