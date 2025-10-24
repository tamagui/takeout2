import { number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import { hasChannelReadPermission, hasChannelWritePermission } from '~/data/where/channel'

export type ChannelTopic = TableInsertRow<typeof schema>

export const schema = table('channelTopic')
  .columns({
    id: string(),
    serverId: string(),
    channelId: string(),
    name: string(),
    count: number(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('channelTopic', (_, auth) => {
  return {
    read: hasChannelReadPermission(_, auth),
    write: hasChannelWritePermission(_, auth),
  }
})

export const mutate = mutations(schema, permissions)
