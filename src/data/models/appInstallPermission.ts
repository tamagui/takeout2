import { number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type AppInstallPermission = TableInsertRow<typeof schema>

export const schema = table('appInstallPermission')
  .columns({
    id: string(),
    serverId: string(),
    appInstallId: string(),
    roleId: string(),
    granterId: string(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('appInstallPermission', (_, auth) => {
  // TODO
  return {
    read: !!auth,
    write: !!auth,
  }
})

export const mutate = mutations(schema, permissions)
