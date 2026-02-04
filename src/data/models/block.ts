import { number, string, table } from '@rocicorp/zero'
import { ensureLoggedIn, mutations, serverWhere } from 'on-zero'

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
    { tx, server },
    data: { blockedId: string; id: string; createdAt: number }
  ) => {
    const authData = ensureLoggedIn()

    await tx.mutate.block.insert({
      ...data,
      blockerId: authData.id,
    })

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'user_blocked', {
          targetUserId: data.blockedId,
        })
      )
    }
  },

  delete: async ({ tx, server }, data: { id: string; blockedUserId?: string }) => {
    const authData = ensureLoggedIn()

    // permissions already ensure user can only delete their own blocks
    await tx.mutate.block.delete({ id: data.id })

    const blockedUserId = data.blockedUserId

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server && blockedUserId) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'user_unblocked', {
          targetUserId: blockedUserId,
        })
      )
    }
  },
})
