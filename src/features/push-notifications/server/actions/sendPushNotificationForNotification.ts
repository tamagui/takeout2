import type { Transaction } from 'over-zero'
import type { MessageUpdate, Notification } from '~/data/types'
import { PRIVATE_CHAT_SEPARATOR } from '~/features/user/getPrivateChatId'
import {
  sendPushNotificationToUser,
  type NotificationContent,
  type NotificationOptions,
} from '../sendPushNotificationToUser'

/**
 * Given a notification (and data related to it), sends a push notification to all of the user's available devices.
 */
export async function sendPushNotificationForNotification(
  notification: Notification,
  {
    message,
  }: {
    /** The message related to the notification, this is necessary if `notification.type` is `'message'` to avoid problems of loading the message from the database again */
    message?: MessageUpdate
  },
  { tx }: { tx: Transaction }
) {
  const [notificationContent, notificationOptions] = await (async (): Promise<
    [NotificationContent | null, NotificationOptions]
  > => {
    switch (notification.type) {
      case 'message': {
        if (!message) {
          throw new Error('Message notification requires the message to be passed in')
        }

        const fromUser = await tx.query.userPublic
          .where('id', '=', notification.fromUserId)
          .one()
        const isPm =
          message.serverId.includes(PRIVATE_CHAT_SEPARATOR) &&
          message.serverId === message.channelId

        if (isPm) {
          return [
            {
              title: fromUser?.name || fromUser?.username || 'Unknown User',
              body: message.content,
            },
            { sound: 'default' },
          ]
        } else {
          const channel = await tx.query.channel.where('id', '=', message.channelId).one()
          const server = await tx.query.server.where('id', '=', message.serverId).one()

          return [
            {
              title: `${fromUser?.name || fromUser?.username || 'Unknown User'} (${channel?.name || 'Unknown Channel'}, ${server?.name || 'Unknown Server'})`,
              body: message.content,
            },
            { sound: 'default' },
          ]
        }
      }
    }

    // Unsupported notification type
    return [null, {}]
  })()

  // Unsupported or unhandled notification type
  if (!notificationContent) return

  await sendPushNotificationToUser(
    notification.userId,
    notificationContent,
    notificationOptions,
    { tx }
  )
}
