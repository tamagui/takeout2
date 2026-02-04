import * as Notifications from 'expo-notifications'
import { useRouter } from 'one'
import { useEffect, type ReactNode } from 'react'

import { showToast } from '../toast/helpers'

import type { ToastOptions } from '../toast/types'

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

export const showNotification = (title: string, options?: ToastOptions) => {
  showToast(title, options)
}

export const hideNotification = () => {}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()

  useEffect(() => {
    // handle foreground notifications - show custom toast
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body } = notification.request.content
        const data = notification.request.content.data as NotificationData | undefined
        console.log('notification received', title, body, data)
        showNotification(title || 'New notification', {
          message: body || undefined,
          haptic: 'success',
          duration: 3000,
        })
      }
    )

    // handle notification tap (when app was in background)
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
      }
    )

    return () => {
      foregroundSubscription.remove()
      responseSubscription.remove()
    }
  }, [router])

  return children
}
