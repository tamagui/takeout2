import { json, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type MessageReactionStats = TableInsertRow<typeof schema>

export const schema = table('messageReactionStats')
  .columns({
    messageId: string(),
    reactionId: string(),
    reactionValue: string(),
    reactionImage: string().optional(),
    reactionCount: number(),
    allUsers: json<Array<{ userId: string; username: string; name: string }>>(),
    lastRefreshedAt: number(),
  })
  .primaryKey('messageId', 'reactionId')

export const permissions = where('messageReactionStats', () => {
  return {
    read: true,
    write: false, // only server can write stats
  }
})

export const mutate = mutations(schema, permissions, {})
