import { boolean, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow, TablePrimaryKeys } from 'over-zero'
import { mutations, where } from 'over-zero'
import { insertPrivateServer } from '~/data/models/helpers/insertPrivateServer'

export type Friendship = TableInsertRow<typeof schema>
export type FriendshipPrimaryIds = Pick<Friendship, TablePrimaryKeys<typeof schema>>

export const schema = table('friendship')
  .columns({
    requestingId: string(),
    acceptingId: string(),
    accepted: boolean(),
    createdAt: number(),
  })
  .primaryKey('requestingId', 'acceptingId')

export const permissions = where('friendship', (_, auth) => {
  const isParticipant = _.or(
    _.cmp('requestingId', auth?.id || ''),
    _.cmp('acceptingId', auth?.id || '')
  )

  const isOwn = _.cmp('requestingId', auth?.id || '')

  return {
    read: isParticipant,
    write: isOwn,
  }
})

export const mutate = mutations(schema, permissions, {
  update: async ({ tx, authData }, partialRow: Friendship) => {
    if (authData?.id && partialRow.accepted === true) {
      await insertPrivateServer(
        tx,
        partialRow.requestingId,
        partialRow.acceptingId,
        authData.id,
        partialRow.createdAt
      )

      await tx.mutate.friendship.update(partialRow)
    }
  },

  insert: async (context, friendship: Friendship) => {
    const { tx } = context
    await tx.mutate.friendship.insert(friendship)
    await tx.mutate.notification.insert({
      id: `${friendship.createdAt}-friendship`,
      type: 'friendship',
      createdAt: friendship.createdAt,
      fromUserId: friendship.requestingId,
      userId: friendship.acceptingId,
      seenAt: null,
    })
  },
})
