import { ensure, EnsureError } from '@take-out/helpers'

import { setDidRunPermissionCheck } from './helpers/didRunPermissionCheck'
import { mutatorContext } from './helpers/mutatorContext'
import { prettyFormatZeroQuery } from './helpers/prettyFormatZeroQuery'
import { getZQL } from './state'
import { getWhereTableName } from './where'

import type { AuthData, Can, TableName, Transaction, Where } from './types'
import type {
  Condition,
  ExpressionBuilder,
  Query,
  Schema as ZeroSchema,
} from '@rocicorp/zero'

export function createPermissions<Schema extends ZeroSchema>({
  environment,
  schema,
}: {
  environment: 'client' | 'server'
  schema: Schema
}) {
  type PermissionReturn = Condition | boolean

  type PermissionsWhere<Table extends TableName = TableName> = Where<
    Table,
    PermissionReturn
  >

  function buildPermissionQuery<PermissionWhere extends PermissionsWhere>(
    authData: AuthData | null,
    eb: ExpressionBuilder<any, any>,
    permissionWhere: PermissionWhere,
    // TODO until i can get a working PickPrimaryKeys<'message'>
    objOrId: Record<string, any> | string,
    tableNameOverride?: TableName
  ) {
    const tableName = tableNameOverride || getWhereTableName(permissionWhere)

    if (!tableName) {
      throw new Error(`Must use PermissionWhere for buildPermissionQuery`)
    }

    const tableSchema = schema.tables[tableName]

    if (!tableSchema) {
      throw new Error(`No schema?`)
    }

    const primaryKeys = tableSchema.primaryKey
    const permissionReturn = permissionWhere(eb, authData)

    if (permissionReturn == null) {
      throw new Error(`No permission defined for ${tableName}`)
    }

    if (permissionReturn === true) {
      return eb.cmpLit(true, '=', true)
    }

    if (permissionReturn === false) {
      return eb.cmpLit(true, '=', false)
    }

    const primaryKeyWheres: Condition[] = []

    for (const key of primaryKeys) {
      const value = typeof objOrId === 'string' ? objOrId : objOrId[key]
      primaryKeyWheres.push(eb.cmp(key as any, value))
    }

    return eb.and(permissionReturn, ...primaryKeyWheres)
  }

  const can: Can = async (where, obj) => {
    // on client we always allow! we only check on server (like zero does)
    if (environment === 'server') {
      const ctx = mutatorContext()
      const tableName = getWhereTableName(where)
      if (!tableName) {
        throw new Error(`Must use where('table') style where to pass to can()`)
      }
      await ensurePermission(ctx.tx, ctx.authData, tableName, where, obj)
      setDidRunPermissionCheck(ctx)
    }
  }

  async function ensurePermission(
    tx: Transaction,
    authData: AuthData | null,
    tableName: TableName,
    where: Where,
    obj: any // TODO until i can get a working PickPrimaryKeys<'message'>
  ): Promise<void> {
    if (authData?.role === 'admin') {
      // admin role can do any mutation
      return
    }

    const zqlBuilder = getZQL() as any
    const queryBase = zqlBuilder[tableName] as Query<any, any>
    let query: Query<any, any, any> | null = null

    try {
      query = queryBase
        .where((eb) => {
          return buildPermissionQuery(authData, eb, where, obj)
        })
        .one()

      ensure(await tx.run(query))
    } catch (err) {
      const errorTitle = `${tableName} with auth id: ${authData?.id}`

      if (err instanceof EnsureError) {
        let msg = `[permission] 🚫 Not Allowed: ${errorTitle}`
        if (process.env.NODE_ENV === 'development' && query) {
          msg += `\n ${prettyFormatZeroQuery(query)}`
        }
        throw new Error(msg)
      }

      throw new Error(`Error running permission ${errorTitle}\n${err}`)
    }
  }

  return {
    can,
    buildPermissionQuery,
  }
}
