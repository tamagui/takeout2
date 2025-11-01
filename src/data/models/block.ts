import { number, string, table } from '@rocicorp/zero'
import { randomId } from '@vxrn/helpers'
import { ensureLoggedIn, mutations, where, type TableInsertRow } from 'over-zero'

export type Block = TableInsertRow<typeof schema>

export const schema = table('block')
  .columns({
    id: string(),
    blockerId: string(),
    blockedId: string(),
    createdAt: number(),
  })
  .primaryKey('id')

const permissions = where('block', (_, auth) => {
  return true
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, environment, server }, data: { blockedId: string }) => {
    const authData = ensureLoggedIn()

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
  },

  delete: async ({ tx, authData, environment, server }, blockedUserId: string) => {
    if (!authData) throw new Error('Must be logged in')

    const block = await tx.query.block
      .where('blockerId', authData.id)
      .where('blockedId', blockedUserId)
      .one()

    if (block?.id) {
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
