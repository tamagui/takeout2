import { number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import { hasChannelReadPermission } from '../where/channel'

export type ChannelPermission = TableInsertRow<typeof schema>

export const schema = table('channelPermission')
  .columns({
    id: string(),
    serverId: string(),
    channelId: string(),
    roleId: string(),
    granterId: string(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('channelPermission', (_, auth) => {
  return {
    read: hasChannelReadPermission(_, auth),
    write: false, // only ever inserted inside another mutator
  }
})

export const mutate = mutations(schema, permissions)
