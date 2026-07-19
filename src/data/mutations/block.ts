import { ensureLoggedIn, mutations, serverWhere } from 'on-zero'

const permissions = serverWhere('block', (_, auth) => {
  return _.cmp('blockerId', auth?.id || '')
})

export const mutate = mutations('block', permissions, {
  insert: async (
    { tx, server, can },
    data: { blockedId: string; id: string; createdAt: number },
  ) => {
    const authData = ensureLoggedIn()

    await tx.mutate.block.insert({
      ...data,
      blockerId: authData.id,
    })
    await can(permissions, data.id)

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server) {
      server.enqueueTask(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'user_blocked', {
          targetUserId: data.blockedId,
        }),
      )
    }
  },

  delete: async ({ tx, server, can }, data: { id: string; blockedUserId?: string }) => {
    const authData = ensureLoggedIn()

    await can(permissions, data.id)
    await tx.mutate.block.delete({ id: data.id })

    const blockedUserId = data.blockedUserId

    if (process.env.VITE_ENVIRONMENT === 'ssr' && server && blockedUserId) {
      server.enqueueTask(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'user_unblocked', {
          targetUserId: blockedUserId,
        }),
      )
    }
  },
})
