import { boolean, enumeration, json, number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import type { ChannelStateData } from 'start/types'
import { createChannelFirstMessage } from '~/features/channel/createChannelFirstMessage'

export type Channel = TableInsertRow<typeof schema>

export const schema = table('channel')
  .columns({
    id: string(),
    serverId: string(),
    name: string(),
    type: enumeration<'chat' | 'bot'>().optional(),
    solo: boolean().optional(),
    description: string(),
    creatorId: string(),
    oldestMessageId: string().optional(),
    chatPrompt: string().optional(),
    private: boolean(),
    readonly: boolean(),
    deleted: boolean(),
    state: json<ChannelStateData>().optional(),
    latestSearchIndexMessage: string().optional(),
    isPrivateChat: boolean(),
    friendId: string().optional(),
    updatedAt: number().optional(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('channel', (_, auth) => {
  const userId = auth?.id || ''

  const isChannelNotPrivate = _.cmp('private', false)

  const isUserRoleOnChannel = _.exists('role', (q) =>
    q.whereExists('member', (q) => q.where('id', userId))
  )

  const isUserAdminOnServer = _.exists('server', (q) =>
    q.whereExists('role', (q) =>
      q.where('canAdmin', true).whereExists('member', (q) => q.where('id', userId))
    )
  )

  const canEditChannel = _.exists('server', (server) => {
    return server.where((_) =>
      _.or(
        _.cmp('creatorId', userId),
        _.cmp('userId', userId),
        _.exists('role', (q) =>
          q
            .where((_) =>
              _.or(
                _.cmp('canAdmin', true),
                _.cmp('canEditChannel', true),
                _.cmp('canEditServer', true)
              )
            )
            .whereExists('member', (q) => q.where('id', userId))
        )
      )
    )
  })

  return {
    read: _.and(
      _.cmp('deleted', '!=', true),
      _.or(isChannelNotPrivate, isUserRoleOnChannel, isUserAdminOnServer)
    ),
    write: canEditChannel,
  }
})

export const mutate = mutations(schema, permissions, {
  migrate: async ({ tx }, channel: Channel) => {
    // todo we need to probably split mutators out finally so we can share migrate
  },

  insert: async ({ authData, server, tx }, channel: Channel) => {
    ensure(authData, 'authData')

    await tx.mutate.channel.insert({
      ...channel,
      oldestMessageId: channel.id,
    })

    await tx.mutate.message.insert(createChannelFirstMessage(channel))

    if (server) {
      const adminRole = await tx.query.role
        .where('serverId', channel.serverId)
        .where('name', 'Admin')
        .where('canAdmin', true)
        .one()

      if (!adminRole) {
        console.warn(`Server has no admin role, which should be impossible`)
        return
      }

      await tx.mutate.channelPermission.insert({
        id: `${channel.id}-channel`,
        roleId: adminRole.id,
        channelId: channel.id,
        granterId: authData.id,
        serverId: channel.serverId,
        createdAt: channel.createdAt,
      })
    }
  },
})
