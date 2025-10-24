import { boolean, number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { ensureLoggedIn, mutations, where } from 'over-zero'
import { createDraftMessage } from '~/features/channel/createDraftMessage'

export type Thread = TableInsertRow<typeof schema>

export const schema = table('thread')
  .columns({
    id: string(),
    channelId: string(),
    serverId: string(),
    description: string().optional(),
    creatorId: string(),
    messageId: string(),
    title: string(),
    deleted: boolean(),
    replyCount: number(),
    updatedAt: number().optional(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('thread', (_, auth) => {
  ensure(auth)

  const isChannelNotPrivate = _.exists('channel', (q) => q.where('private', false))

  const isUserRoleOnChannel = _.exists('channel', (q) =>
    q.whereExists('role', (q) =>
      q.where((_) => _.exists('member', (q) => q.where('id', auth.id || '')))
    )
  )

  const isUserAdminOnServer = _.exists('server', (q) =>
    q.whereExists('role', (q) =>
      q.where((_) =>
        _.and(
          _.cmp('canAdmin', true),
          _.exists('member', (q) => q.where('id', auth.id || ''))
        )
      )
    )
  )

  const isUserBot = _.or(_.exists('creator', (q) => q.where('username', 'hud')))

  const isChannelNotReadOnly = _.exists('channel', (q) => q.where('readonly', false))
  const isUserCreator = _.cmp('creatorId', auth.id || '')

  return {
    read: _.and(
      _.cmp('deleted', '!=', true),
      _.or(isChannelNotPrivate, isUserRoleOnChannel, isUserAdminOnServer),
      _.or(
        isUserAdminOnServer,
        isUserBot,
        _.or(
          isUserCreator,
          _.exists('channel', (q) => q.where('type', '!=', 'bot'))
        )
      )
    ),
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
  insert: async (
    { tx, server },
    { nextDraftId, ...thread }: Thread & { nextDraftId: string }
  ) => {
    const authData = ensureLoggedIn()
    const threadToInsert = { ...thread }

    if (server && !threadToInsert.title) {
      try {
        const message = await tx.query.message.where('id', threadToInsert.messageId).one()

        if (message?.content) {
          const title = await server.actions.thread.generateThreadTitle(message.content)
          threadToInsert.title = title
        }
      } catch (err) {
        console.error(`Error generating thread title: ${err}`)
      }
    }

    await tx.mutate.thread.insert(threadToInsert)
    await tx.mutate.message.update({
      id: thread.messageId,
      threadId: thread.id,
      isThreadReply: false,
    })

    await tx.mutate.message.insert(
      createDraftMessage({
        id: nextDraftId,
        channelId: thread.channelId,
        creatorId: authData.id,
        serverId: thread.serverId,
        threadId: thread.id,
      })
    )
  },

  updateTitle: async (
    { tx, server },
    { threadId, content }: { threadId: string; content: string }
  ) => {
    if (server) {
      await tx.mutate.thread.update({
        id: threadId,
        title: await server.actions.ai.summarize(content),
      })
    }
  },
})
