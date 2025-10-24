import { number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import { hasChannelReadPermission, hasChannelWritePermission } from '../where/channel'

export type ChannelTopicMessage = TableInsertRow<typeof schema>

export const schema = table('channelTopicMessage')
  .columns({
    id: string(),
    channelId: string(),
    serverId: string(),
    topicId: string(),
    messageId: string(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('channelTopicMessage', (_, auth) => {
  ensure(auth)
  return {
    read: hasChannelReadPermission(_, auth),
    write: hasChannelWritePermission(_, auth),
  }
})

export const mutate = mutations(schema, permissions, {})
