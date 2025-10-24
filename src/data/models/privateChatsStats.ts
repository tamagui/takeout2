import { number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type PrivateChatsStats = TableInsertRow<typeof schema>

export const schema = table('privateChatsStats')
  .columns({
    serverId: string(),
    userServerId: string(),
    userAId: string(),
    userBId: string(),
    score: number(),
    lastMessageAt: number(),
    messageCountWeek: number(),
    messageCountMonth: number(),
    messageCountYear: number(),
    lastRefreshedAt: number(),
  })
  .primaryKey('serverId', 'userServerId')

export const permissions = where('privateChatsStats', (_, auth) => {
  const isParticipant = _.or(
    _.cmp('userAId', auth?.id || ''),
    _.cmp('userBId', auth?.id || '')
  )

  return {
    read: isParticipant,
    write: false, // only server can write stats
  }
})

export const mutate = mutations(schema, permissions)
