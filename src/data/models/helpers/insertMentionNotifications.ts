import { context } from 'over-zero'
import type { MessageUpdate, Notification } from '~/data/types'
import { MENTION_REGEXP } from '~/features/mention/constants'

export async function insertMentionNotifications(message: MessageUpdate) {
  const { tx, server } = context()

  if (!server || message.type === 'draft' || message.type === 'hidden') {
    return
  }

  try {
    const channel = await tx.query.channel.where('id', message.channelId || '').one()

    if (channel?.isPrivateChat) {
      console.warn(
        `‼️ next zero query was wrapped in serverTransaction due to hang, unwrapped in migration, if hang happens here again`
      )
      // TODO zero bug: we run the query in advance once to get the data or else it never returns from the promise
      // await tx.query.server
      //   .where('id', message.serverId || '')
      //   .one()
      //   // @ts-ignore
      //   .related('member', (q) => q.where('id', '!=', message.creatorId).one())
      //   .run()

      const server = await tx.query.server
        .where('id', message.serverId || '')
        .one()
        .related('member', (q) => q.where('id', '!=', message.creatorId).one())

      if (server?.member) {
        const otherUser = server.member

        if (otherUser) {
          // TODO zero bug: we run the query in advance once to get the data or else it never returns from the promise
          // await serverActions?.serverTransaction(async (tx) => {
          //   return await tx.query.userPublic
          //     .where('id', otherUser.id)
          //     .one()
          //     // @ts-ignore
          //     .related('state', (q) => q.one())
          // })

          const userPublic = await tx.query.userPublic
            .where('id', otherUser.id)
            .one()
            .related('state', (q) => q.one())

          const settings = userPublic?.state?.settings || {}
          const notificationPref = settings.notifications || 'everything'

          if (notificationPref === 'direct' || notificationPref === 'everything') {
            const notificationData = {
              id: `${message.id}-message`,
              type: 'message' as const,
              messageId: message.id,
              channelId: message.channelId || '',
              fromUserId: message.creatorId,
              serverId: message.serverId || '',
              userId: otherUser.id,
              createdAt: message.createdAt,
              seenAt: null,
            }

            await insertNotification({
              notificationData,
              message,
            })
          }
        }
      }

      return
    }

    const mentions = Array.from(message.content.matchAll(MENTION_REGEXP))

    for (const match of mentions) {
      const type = match.groups?.type
      const id = match.groups?.id

      // if (id) {
      //   // TODO zero bug: we run the query in advance once to get the data or else it never returns from the promise
      //   await serverActions?.serverTransaction(async (tx) => {
      //     return await tx.query.userPublic
      //       .where('id', id)
      //       .one()
      //       // @ts-ignore
      //       .related('state', (q) => q.one())
      //   })
      // }

      try {
        if (type === 'user' && id) {
          // ⚠️ getting stuck here i believe due to permissions:
          // we need a way to override permissions or we have to bail from zero
          const userPublic = await tx.query.userPublic
            .where('id', id)
            .one()
            .related('state', (q) => q.one())

          if (!userPublic?.state) continue

          const settings = userPublic.state.settings || {}
          const notificationPref = settings.notifications || 'everything'

          if (notificationPref === 'direct' || notificationPref === 'everything') {
            const notificationData: Notification = {
              id: `${message.id}-message`,
              type: 'message' as const,
              messageId: message.id,
              channelId: message.channelId || '',
              serverId: message.serverId || '',
              fromUserId: message.creatorId,
              userId: id,
              createdAt: message.createdAt,
              seenAt: null,
            }

            await insertNotification({
              notificationData,
              message,
            })
          }
        }
      } catch (err) {
        console.error(`Error inserting notification`, err)
      }
    }
  } catch (err) {
    console.error(
      `[zero.mutate.message] error creating mention notifications for message ${message.id}: ${err}`
    )
  }
}

async function insertNotification({
  notificationData,
  message,
}: {
  notificationData: Notification
  message: MessageUpdate
}) {
  const { tx, server } = context()
  // if (server) {
  //   try {
  //     // Use serverMutation so that mutators will also run on notification insertion
  //     // Use dynamic import so server-only code won't be executed on client
  //     const { serverMutation } = await import('../../server/serverMutation')
  //     await serverMutation('notification.insert', authData, notificationData)
  //   } catch (error) {
  //     console.error('Failed to send notification via serverMutation:', error)
  //     // Fallback to direct insert
  //     await tx.mutate.notification.insert(notificationData)
  //   }
  // } else {
  //   // On client, use direct insert
  //   await tx.mutate.notification.insert(notificationData)
  // }

  await tx.mutate.notification.insert(notificationData)

  if (server) {
    await server.actions.notification.sendPushNotificationForNotification(
      notificationData,
      { message },
      { tx }
    )
  }
}
