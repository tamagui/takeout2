import { boolean, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type ChannelActive = TableInsertRow<typeof schema>

export const schema = table('channelActive')
  .columns({
    userId: string(),
    channelId: string(),
    lastSeenAt: number(),
    hasAudio: boolean().optional(),
    hasVideo: boolean().optional(),
  })
  .primaryKey('userId', 'channelId')

export const permissions = where('channelActive', (_, auth) => {
  return {
    read: !!auth, // TODO
    write: _.cmp('userId', auth?.id || ''),
  }
})

export const mutate = mutations(schema, permissions, {})
