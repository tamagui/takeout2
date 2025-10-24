import type { Transaction } from 'over-zero'
import { sendApnsNotification } from './sendApnsNotification'

export type NotificationContent = string | { title: string; body: string }

/**
 * TODO: Support more options like sound, priority, etc.
 */
export type NotificationOptions = {
  sound?: string
}

/**
 * Given a user ID, sends a push notification to all of their available devices.
 */
export async function sendPushNotificationToUser(
  userId: string,
  content: NotificationContent,
  options: NotificationOptions,
  { tx }: { tx: Transaction }
) {
  const iosDevices = await tx.query.device
    .where('userId', userId)
    .where('type', 'ios')
    .limit(100)

  const iosPayload = {
    aps: {
      alert: content,
      sound: options.sound,
    },
  }

  const iosPromises = iosDevices.map(async (device) => {
    try {
      const result = await sendApnsNotification(
        device.appBundleId,
        device.deviceToken,
        iosPayload
      )

      if (result.ok) {
        // ok
      } else {
        throw new Error(
          `Failed to send push notification to device ${device.id}: [${result.status}] ${result.text}`
        )
      }
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Error sending push notification to device ${device.id}: ${error.message}`
      }

      throw error
    }
  })

  await Promise.all(iosPromises)
}
