import * as Haptics from 'expo-haptics'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'one'
import { useEffect } from 'react'

import { toast } from '@tamagui/toast'

type NotificationData = {
  postId?: string
  commentId?: string
  notificationId?: string
  type?: string
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
})

export const useNativePushListeners = () => {
  const router = useRouter()

  useEffect(() => {
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body } = notification.request.content
        const data = notification.request.content.data as NotificationData | undefined
        console.info('notification received', title, body, data)

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        toast(title || 'New notification', {
          description: body || undefined,
          duration: 3000,
        })
      },
    )

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | NotificationData
          | undefined

        if (data?.postId) {
          router.push(`/home/feed/post/${data.postId}`)
        } else {
          router.push('/home/notification')
        }
      },
    )

    return () => {
      foregroundSubscription.remove()
      responseSubscription.remove()
    }
  }, [router])
}
