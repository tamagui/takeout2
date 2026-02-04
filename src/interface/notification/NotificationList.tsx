import { LegendList } from '@legendapp/list'
import { memo, useCallback } from 'react'
import { SizableText, Spinner, YStack } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { useNotifications } from '~/features/notification/useNotifications'
import { zero } from '~/zero/client'

import { NotificationListItem } from './NotificationListItem'

import type { Notification, User } from '~/data/generated/types'
import type { NotificationType } from '~/features/notification/types'

type NotificationWithActor = Notification & {
  actor?: User | null
}

type NotificationListProps = {
  onNotificationPress?: (notification: NotificationWithActor) => void
  pageSize?: number
}

export const NotificationList = memo(
  ({ onNotificationPress, pageSize = 50 }: NotificationListProps) => {
    const { user } = useAuth()
    const { notifications, status } = useNotifications(user?.id ?? '', pageSize)

    const handleMarkRead = useCallback(async (notificationId: string) => {
      await zero.mutate.notification.update({
        id: notificationId,
        read: true,
      })
    }, [])

    const handlePress = useCallback(
      (notification: NotificationWithActor) => {
        if (!notification.read) {
          handleMarkRead(notification.id)
        }
        onNotificationPress?.(notification)
      },
      [handleMarkRead, onNotificationPress]
    )

    const renderItem = useCallback(
      ({ item }: { item: NotificationWithActor }) => (
        <NotificationListItem
          id={item.id}
          actorName={item.actor?.name ?? undefined}
          actorImage={item.actor?.image ?? undefined}
          type={item.type as NotificationType}
          title={item.title ?? 'Notification'}
          body={item.body ?? undefined}
          read={item.read}
          createdAt={item.createdAt}
          onPress={() => handlePress(item)}
        />
      ),
      [handlePress]
    )

    const keyExtractor = useCallback((item: NotificationWithActor) => item.id, [])

    const isLoading = status.type === 'unknown'

    if (isLoading) {
      return (
        <YStack flex={1} items="center" justify="center" py="$8">
          <Spinner />
        </YStack>
      )
    }

    if (!notifications || notifications.length === 0) {
      return (
        <YStack flex={1} items="center" justify="center" py="$8">
          <SizableText size="$4" color="$color10">
            No notifications yet
          </SizableText>
        </YStack>
      )
    }

    return (
      <LegendList
        data={notifications as unknown as NotificationWithActor[]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    )
  }
)
