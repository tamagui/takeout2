import { number, string, table } from '@rocicorp/zero'
import { randomId } from '@take-out/helpers'
import { ensureLoggedIn, mutations, serverWhere } from 'over-zero'

export const schema = table('block')
  .columns({
    id: string(),
    blockerId: string(),
    blockedId: string(),
    createdAt: number(),
  })
  .primaryKey('id')

const permissions = serverWhere('block', (_, auth) => {
  return _.cmp('blockerId', auth?.id || '')
})

export const mutate = mutations(schema, permissions, {
  insert: async (
    { tx, environment, server },
    data: { blockedId: string; id: string; createdAt: number }
  ) => {
    const authData = ensureLoggedIn()

    await tx.mutate.block.insert({
      ...data,
      blockerId: authData.id,
    })

    if (environment === 'server' && server) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'user_blocked', {
          targetUserId: data.blockedId,
        })
      )
    }
  },

  delete: async (
    { tx, authData, environment, server },
    data: { id: string; blockedUserId?: string }
  ) => {
    if (!authData) throw new Error('Must be logged in')

    // permissions already ensure user can only delete their own blocks
    await tx.mutate.block.delete({ id: data.id })

    const blockedUserId = data.blockedUserId
    if (environment === 'server' && server && blockedUserId) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'user_unblocked', {
          targetUserId: blockedUserId,
        })
      )
    }
  },
})
