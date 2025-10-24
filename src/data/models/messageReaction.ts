import { number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type MessageReaction = TableInsertRow<typeof schema>

export const schema = table('messageReaction')
  .columns({
    messageId: string(),
    channelId: string().optional(),
    creatorId: string(),
    reactionId: string(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('messageId', 'creatorId', 'reactionId')

export const permissions = where('messageReaction', (_, auth) => {
  const isUsersOwn = _.cmp('creatorId', auth?.id || '')
  return {
    read: true, // TODO
    write: isUsersOwn,
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, server }, messageReaction: MessageReaction) => {
    await tx.mutate.messageReaction.insert(messageReaction)
    await server?.actions.messageReaction.updateUserTopReactions(
      messageReaction.creatorId
    )
  },

  delete_: async (
    { tx, server },
    messageReaction: {
      messageId: string
      creatorId: string
      reactionId: string
    }
  ) => {
    await tx.mutate.messageReaction.delete(messageReaction)
    await server?.actions.messageReaction.updateUserTopReactions(
      messageReaction.creatorId
    )
  },
})
