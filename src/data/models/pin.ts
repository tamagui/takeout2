import { number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import { hasChannelReadPermission, hasChannelWritePermission } from '../where/channel'

export type Pin = TableInsertRow<typeof schema>

export const schema = table('pin')
  .columns({
    id: string(),
    serverId: string(),
    channelId: string(),
    messageId: string(),
    creatorId: string(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('pin', (_, auth) => {
  return {
    read: hasChannelReadPermission(_, auth),
    write: hasChannelWritePermission(_, auth),
  }
})

export const mutate = mutations(schema, permissions)
