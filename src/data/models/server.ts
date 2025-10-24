import { boolean, json, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { ensureLoggedIn, mutations, where } from 'over-zero'
import type { ServerState } from 'start/types'
import { insertServer } from '~/data/models/helpers/insertServer'

export type Server = TableInsertRow<typeof schema>

export const schema = table('server')
  .columns({
    id: string(),
    name: string(),
    creatorId: string(),
    userId: string().optional(),
    serverBotId: string().optional(),
    channelSort: json<string[]>(),
    state: json<ServerState>(),
    description: string(),
    icon: string(),
    banner: string().optional(),
    domain: string().optional(),
    isPrivateChat: boolean(),
    private: boolean().optional(),
    friendId: string().optional(),
    tint: number().optional(),
    updatedAt: number().optional(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('server', (_, auth) => {
  const userId = auth?.id || ''

  return {
    read: _.or(
      _.not(_.cmp('isPrivateChat', true)),
      _.or(_.cmp('friendId', userId), _.cmp('creatorId', userId))
    ),
    write: _.or(
      _.cmp('creatorId', userId),
      _.exists('role', (q) =>
        q
          .where((_) => _.or(_.cmp('canAdmin', true), _.cmp('canEditServer', true)))
          .whereExists('member', (q) => q.where('id', userId))
      )
    ),
    delete: _.cmp('creatorId', userId),
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async (ctx, server: Server) => {
    const { tx, server: serverCtx } = ctx
    const serverId = server.id

    if (serverCtx) {
      // convert data URL to actual R2 upload
      let serverToInsert = server
      if (server.icon?.startsWith('data:') || server.banner?.startsWith('data:')) {
        const { uploadDataUrlToR2 } = await import('~/features/upload/uploadDataUrl')

        const icon = server.icon?.startsWith('data:')
          ? await uploadDataUrlToR2(server.icon)
          : server.icon
        const banner = server.banner?.startsWith('data:')
          ? await uploadDataUrlToR2(server.banner)
          : server.banner

        serverToInsert = { ...server, icon, banner }
      }

      // only creating erver on server side since it's doing various setup things
      await insertServer(tx, serverToInsert, {
        withMainChannel: true,
      })

      await serverCtx.actions.server.ensureServerBot(ctx, serverId)
    }
  },

  ensureAllPrivateChatStats: async (ctx, serverId: string) => {
    const { server } = ctx
    if (server) {
      const result = await server.actions.server.ensureAllPrivateChatStats(ctx, serverId)
      console.info('ensureAllPrivateChatStats result:', result)
    }
  },
})
