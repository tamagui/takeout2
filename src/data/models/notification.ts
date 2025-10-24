import { enumeration, number, string, table } from '@rocicorp/zero'
import type { NotificationType } from 'start/types'
import { mutations } from 'over-zero'
import { where } from 'over-zero'
import type { TableInsertRow } from 'over-zero'

export type Notification = TableInsertRow<typeof schema>

export const schema = table('notification')
  .columns({
    id: string(),
    userId: string(),
    type: enumeration<NotificationType>(),
    messageId: string().optional(),
    channelId: string().optional(),
    serverId: string().optional(),
    fromUserId: string(),
    createdAt: number(),
    seenAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('notification', (_, auth) => {
  const isUsersOwn = _.cmp('userId', auth?.id || '')
  return {
    read: isUsersOwn,
    write: isUsersOwn,
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx }, notification: Notification) => {
    // Insert the notification
    await tx.mutate.notification.insert(notification)

    // Send push notifications on server-side only
    // Sending push notifications in `src/zero/mutators/helpers/createMentionNotifications.ts` directly for now,
    // due to `messagePromise` in `src/zero/mutators/server-actions/sendPushNotificationToUser.ts` will never resolve.
    // if (server) {
    //   const pushNotificationPromise = sendPushNotification(notification)
    //   server.asyncTasks.push(() => pushNotificationPromise)
    // }
  },
})
