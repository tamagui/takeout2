import { boolean, number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import { hasServerAdminPermission } from '../where/server'

export type Role = TableInsertRow<typeof schema>

export const schema = table('role')
  .columns({
    id: string(),
    name: string(),
    color: string(),
    image: string().optional(),
    serverId: string(),
    creatorId: string(),
    canAdmin: boolean(),
    canEditChannel: boolean(),
    canEditServer: boolean(),
    canEditApp: boolean(),
    updatedAt: number().optional(),
    createdAt: number(),
    order: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('role', (_, auth) => {
  ensure(auth)
  return {
    read: true,
    write: hasServerAdminPermission(_, auth),
  }
})

export const mutate = mutations(schema, permissions)
