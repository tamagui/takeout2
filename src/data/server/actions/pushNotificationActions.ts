import { and, eq, ne } from 'drizzle-orm'

import { getDb } from '~/database'
import { device, notification, post, userPublic } from '~/database/schema-public'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export type NotificationType = 'comment' | 'system'

type CreateNotificationParams = {
  userId: string // recipient
  actorId?: string // user who triggered
  type: NotificationType
  title: string
  body?: string
  data?: Record<string, unknown> // postId, commentId, etc
}

type ExpoPushMessage = {
  to: string
  title: string
  body?: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
  channelId?: string
}

type ExpoPushTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message: string; details?: { error: string } }

// create in-app notification and send push to native devices
export const createNotification = async (params: CreateNotificationParams) => {
  const { userId, actorId, type, title, body, data } = params
  const db = getDb()

  const notificationId = crypto.randomUUID()

  // insert notification into database (zero will sync to all clients)
  await db.insert(notification).values({
    id: notificationId,
    userId,
    actorId,
    type,
    title,
    body,
    data: data ? JSON.stringify(data) : undefined,
    read: false,
    createdAt: new Date().toISOString(),
  })

  // send push notification to native devices only (ios/android)
  await sendPushToUser(userId, title, body, {
    notificationId,
    type,
    ...data,
  })

  return notificationId
}

// send expo push notification to all native devices for a user
export const sendPushToUser = async (
  userId: string,
  title: string,
  body?: string,
  data?: Record<string, unknown>
) => {
  const db = getDb()

  // get all devices with push enabled, excluding web
  const devices = await db
    .select({ pushToken: device.pushToken, platform: device.platform })
    .from(device)
    .where(
      and(
        eq(device.userId, userId),
        eq(device.pushEnabled, true),
        ne(device.platform, 'web')
      )
    )

  const tokens = devices.filter((d) => d.pushToken).map((d) => d.pushToken as string)

  if (tokens.length === 0) {
    return { sent: 0, tickets: [] }
  }

  return sendExpoPush(tokens, title, body, data)
}

// send push notifications via expo push api
export const sendExpoPush = async (
  pushTokens: string[],
  title: string,
  body?: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; tickets: ExpoPushTicket[] }> => {
  if (pushTokens.length === 0) {
    return { sent: 0, tickets: [] }
  }

  const messages: ExpoPushMessage[] = pushTokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: 'default',
  }))

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      console.error('expo push api error:', response.status, await response.text())
      return { sent: 0, tickets: [] }
    }

    const result = (await response.json()) as { data: ExpoPushTicket[] }
    const successCount = result.data.filter((t) => t.status === 'ok').length

    console.info(`sent ${successCount}/${pushTokens.length} push notifications`)

    return { sent: successCount, tickets: result.data }
  } catch (error) {
    console.error('failed to send expo push:', error)
    return { sent: 0, tickets: [] }
  }
}

// mark notification as read
export const markNotificationRead = async (notificationId: string, userId: string) => {
  const db = getDb()
  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.id, notificationId), eq(notification.userId, userId)))
}

// mark all notifications as read for a user
export const markAllNotificationsRead = async (userId: string) => {
  const db = getDb()
  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.userId, userId), eq(notification.read, false)))
}

export const notifyCommentOnPost = async (params: {
  postId: string
  commentId: string
  commenterId: string
  commentContent: string
}) => {
  const { postId, commentId, commenterId, commentContent } = params
  const db = getDb()

  const [postRow] = await db
    .select({ userId: post.userId })
    .from(post)
    .where(eq(post.id, postId))

  if (!postRow) return

  const postOwnerId = postRow.userId

  if (postOwnerId === commenterId) return

  const [commenter] = await db
    .select({ name: userPublic.name, username: userPublic.username })
    .from(userPublic)
    .where(eq(userPublic.id, commenterId))

  const commenterName = commenter?.name || commenter?.username || 'Someone'
  const truncatedContent =
    commentContent.length > 100 ? `${commentContent.slice(0, 100)}...` : commentContent

  await createNotification({
    userId: postOwnerId,
    actorId: commenterId,
    type: 'comment',
    title: commenterName,
    body: `${commenterName} commented: ${truncatedContent}`,
    data: { postId, commentId },
  })
}

export const pushNotificationActions = () => ({
  createNotification,
  notifyCommentOnPost,
  sendPushToUser,
  sendExpoPush,
  markNotificationRead,
  markAllNotificationsRead,
})
