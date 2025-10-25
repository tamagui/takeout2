import { number, string, table } from '@rocicorp/zero'
import { mutations, where, type TableInsertRow } from 'over-zero'
import { randomId } from '@vxrn/helpers'

export type Block = TableInsertRow<typeof schema>

// schema for blocked users
export const schema = table('block')
  .columns({
    id: string(),
    blockerId: string(), // user who blocks
    blockedId: string(), // user being blocked
    createdAt: number(),
  })
  .primaryKey('id')

// permissions - users can manage their own blocks
export const permissions = where('block', (eb, auth) => {
  return {
    read: true,
    write: true,
  }
})

// mutations
export const mutate = mutations(schema, permissions, {
  // block a user
  insert: async ({ tx, authData, environment, server }, data: { blockedId: string }) => {
    if (!authData) throw new Error('Must be logged in')

    // check if already blocked
    const existing = await tx.query.block
      .where('blockerId', authData.id)
      .where('blockedId', data.blockedId)
      .one()

    if (!existing) {
      await tx.mutate.block.insert({
        id: randomId(),
        blockerId: authData.id,
        blockedId: data.blockedId,
        createdAt: Date.now(),
      })

      if (environment === 'server' && server) {
        server.asyncTasks.push(() =>
          server.actions.analyticsActions().logEvent(authData.id, 'user_blocked', {
            targetUserId: data.blockedId,
          })
        )
      }
    }
  },

  // unblock a user
  delete_: async ({ tx, authData, environment, server }, blockedUserId: string) => {
    if (!authData) throw new Error('Must be logged in')

    const block = await tx.query.block
      .where('blockerId', authData.id)
      .where('blockedId', blockedUserId)
      .one()

    if (block) {
      await tx.mutate.block.delete({ id: block.id })

      if (environment === 'server' && server) {
        server.asyncTasks.push(() =>
          server.actions.analyticsActions().logEvent(authData.id, 'user_unblocked', {
            targetUserId: blockedUserId,
          })
        )
      }
    }
  },
})
