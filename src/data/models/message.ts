import { boolean, enumeration, number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import type { MessageType } from 'start/types'
import { insertMentionNotifications } from '~/data/models/helpers/insertMentionNotifications'
import { runAppActionsFromMessage } from '~/data/models/helpers/runAppActionsFromMessage'
import { updateChannelTopics } from '~/data/models/helpers/updateChannelTopics'
import { updateMessageApp } from '~/data/models/helpers/updateMessageApp'
import { updateMessageAppIcon } from '~/data/models/helpers/updateMessageAppIcon'
import type { MessageUpdate, SendMessage } from '~/data/types'
import { hasChannelReadPermission, hasChannelRole } from '~/data/where/channel'
import { createDraftMessage } from '~/features/channel/createDraftMessage'
import { hasServerAdminPermission } from '../where/server'

export type Message = TableInsertRow<typeof schema>

export const schema = table('message')
  .columns({
    id: string(),
    serverId: string(),
    type: enumeration<MessageType>(),
    order: string(),
    summary: string().optional(),
    channelId: string(),
    threadId: string().optional(),
    isThreadReply: boolean(),
    creatorId: string(),
    replyingToId: string().optional(),
    content: string(),
    createdAt: number(),
    updatedAt: number().optional(),
    deleted: boolean(),
  })
  .primaryKey('id')

export const permissions = where('message', (_, auth) => {
  if (auth?.role === 'admin') {
    return {
      read: true,
      write: true,
    }
  }

  const isUserRoleOnChannel = hasChannelRole(_, auth)
  const isUserAdminOnServer = hasServerAdminPermission(_, auth)
  const canReadChannel = hasChannelReadPermission(_, auth)

  // TODO
  // we let people do anything with hud messages, secure maybe move server-side
  const isUserBot = _.or(
    _.exists('creator', (q) => q.where('username', 'hud'))
    // _.exists('creator', (q) => q.related('roles', (q) => q.where('name', 'Hud')))
  )

  const isChannelNotReadOnly = _.exists('channel', (q) => q.where('readonly', false))
  const isUserCreator = _.cmp('creatorId', auth?.id || '')

  return {
    read: _.and(_.cmp('deleted', '!=', true), canReadChannel),

    write: _.or(
      isUserAdminOnServer,
      isUserBot,
      _.or(
        _.and(isUserCreator, isChannelNotReadOnly),
        _.and(isUserCreator, isUserRoleOnChannel)
      )
    ),
  }
})

export const mutate = mutations(schema, permissions, {
  save: async ({ tx, server, can }, message: MessageUpdate) => {
    await can(permissions, 'write', message)

    if (message.deleted) {
      await tx.mutate.message.update(message)
      return
    }

    await tx.mutate.message.update(message)

    if (server && message.content && message.type !== 'draft') {
      await Promise.all([
        updateMessageApp(message),
        updateMessageAppIcon(message),
        insertMentionNotifications(message),
        updateChannelTopics(message),
        runAppActionsFromMessage(message),
      ])
    }
  },

  send: async ({ tx, authData, server, can }, props: SendMessage) => {
    ensure(authData)

    // draft message already exists in db so we can run permissions before (usually on insert you run after)
    await can(permissions, 'write', props)

    const { attachments, nextDraftId, ...draftMessage } = props

    const message = {
      ...draftMessage,
      creatorId: authData.id,
      type: 'person',
      deleted: false,
    } satisfies Message

    // if (!server) {
    //   console.groupCollapsed(`send message`)
    //   console.info({ message, nextDraftId, attachments })
    //   console.groupCollapsed('trace >')
    //   console.trace()
    //   console.groupEnd()
    //   console.groupEnd()
    // }

    await tx.mutate.message.update(message)

    if (attachments) {
      for (const attachment of attachments) {
        await tx.mutate.attachment.update({
          ...attachment,
          draft: false,
        })
      }
    }

    if (draftMessage.type !== 'bot') {
      const nextDraft = createDraftMessage({
        ...message,
        id: nextDraftId,
      })
      await tx.mutate.message.insert(nextDraft)
    }

    if (server && message.content) {
      // TODO we should put all these together into something like `runMessageEffects` and use it here and on "save"
      await Promise.all([
        insertMentionNotifications(message),
        updateChannelTopics(message),
        runAppActionsFromMessage(message),
        updateMessageApp(message),
        updateMessageAppIcon(message),
      ])
    }
  },

  insertBulk: async ({ tx }, messages: Message[]) => {
    // TODO ensureAdmin helper, pass authData role, since this is devtool only in dev mode
    if (process.env.NODE_ENV === 'development') {
      for (const message of messages) {
        await tx.mutate.message.insert(message)
      }
    }
  },

  deleteAll: async ({ tx, authData }, channelId: string) => {
    if (process.env.NODE_ENV === 'development') {
      ensure(authData, 'authData')

      const all = await tx.query.message.where('channelId', channelId)

      for (const item of all) {
        await tx.mutate.message.delete(item)
      }
    }
  },
})
