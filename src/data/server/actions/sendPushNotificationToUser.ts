// import type { TX } from '../types'
// import type { Notification } from '~/data/types'
// import { sendApnsNotification } from '~/features/push-notifications/server/sendApnsNotification'

// export async function sendPushNotificationToUser(tx: TX, notification: Notification) {
//   try {
//     // Get all iOS devices for the user
//     const devices = await tx.query.device
//       .where('userId', notification.userId)
//       .where('type', 'ios')
//       .run({ type: 'complete' })

//     if (devices.length === 0) {
//       return
//     }

//     // Get message content if this is a message notification
//     let title = 'New notification'
//     let body = 'You have a new notification'

//     if (notification.type === 'message' && notification.messageId) {
//       try {
//         const messagePromise = tx.query.message
//           .where('id', notification.messageId)
//           .related('creator')
//           .related('channel')
//           .one()
//           .run({ type: 'complete' })

//         const message = await Promise.race([
//           messagePromise,
//           new Promise((_, reject) =>
//             // TODO: messagePromise actually never resolves, and this timeout always triggers. Maybe because we are in a transaction that creates that message?
//             setTimeout(() => reject(new Error('query timeout')), 5000)
//           ),
//         ])

//         if (message) {
//           title = (message as any).channel?.name
//             ? `#${(message as any).channel.name}`
//             : 'New message'
//           if ((message as any).creator?.name) {
//             title = `${(message as any).creator.name} in ${title}`
//           }
//           body = (message as any).content || 'Sent a message'
//         } else {
//           title = 'New message'
//           body = 'You have a new message'
//         }
//       } catch (error) {
//         console.error('Failed to fetch message details for notification:', error)
//       }
//     }

//     const payload = {
//       aps: {
//         alert: {
//           title,
//           body,
//         },
//       },
//     }

//     // Send push notification to each device
//     const promises = devices.map(async (device) => {
//       try {
//         const result = await sendApnsNotification(
//           device.appBundleId,
//           device.deviceToken,
//           payload
//         )

//         if (result.ok) {
//           console.info(`Push notification sent successfully to device ${device.id}`)
//         } else {
//           console.error(`Failed to send push notification to device ${device.id}:`, {
//             status: result.status,
//             body: await result.text(),
//           })
//         }
//       } catch (error) {
//         console.error(`Error sending push notification to device ${device.id}:`, error)
//       }
//     })

//     await Promise.all(promises)
//     console.info(
//       `Sent push notifications to ${devices.length} devices for user ${notification.userId}`
//     )
//   } catch (error) {
//     console.error('Failed to send push notifications:', error)
//   }
// }
