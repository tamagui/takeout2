import { where } from './where'

import type { TableName, Where, WhereBuilder } from './types'
import type { Condition } from '@rocicorp/zero'

export function serverWhere<Table extends TableName, Builder extends WhereBuilder<Table>>(
  tableName: Table,
  builder: Builder
): Where<Table, Condition>

export function serverWhere<
  Table extends TableName,
  Builder extends WhereBuilder = WhereBuilder<Table>,
>(builder: Builder): Where<Table, Condition>

export function serverWhere<Table extends TableName, Builder extends WhereBuilder<Table>>(
  a: Table | Builder,
  b?: Builder
): Where<Table, any> | Builder {
  return where(a as any, b as any, true)
}
