import { LegendList } from '@legendapp/list'
import { memo, useEffect, useMemo } from 'react'
import { SizableText, Spacer, YStack } from 'tamagui'
import { useCurrentServerPage } from '~/context/CurrentServerPageContext'
import { MessageItemMinimal } from '~/features/message/ui/MessageItemMinimal'
import { MessagesLoading } from '~/features/message/ui/MessagesLoading'
import {
  isFriendshipNotification,
  isMessageNotification,
} from '~/features/notification/helpers'
import { createEmitter } from '@vxrn/helpers'
import { isEqualIdentity } from '@vxrn/helpers'
import { isTauri } from '@vxrn/helpers'
import type {
  NotificationFriendship,
  NotificationMessageWithRelations,
} from '~/data/types'
import { animationClamped } from '../animations/animationClamped'
import { useLatestNotifications } from './useLatestNotifications'

// we only show up to 9 and then just show 9+
export const notificationsCountEmitter = createEmitter<number | null>(
  'notificationsCount',
  null,
  {
    comparator: isEqualIdentity,
  }
)

export const SidebarActivity = memo(() => {
  const isActive = useCurrentServerPage() === 'activity'

  return (
    <YStack
      fullscreen
      animateOnly={['transform', 'opacity']}
      t={125 + (isTauri ? 35 : 0)}
      r={10}
      l={10}
      b={72}
      shadowColor="$shadow4"
      shadowRadius={5}
      shadowOffset={{ height: 2, width: 0 }}
      z={1000}
      rounded="$4"
      overflow="hidden"
      animation={animationClamped('quick')}
      y={isActive ? 0 : -10}
      opacity={isActive ? 1 : 0}
      bg="$color2"
      pointerEvents={isActive ? 'auto' : 'none'}
      className={isActive ? '' : 'hide-messages'}
    >
      <Content />
    </YStack>
  )
})

const Content = memo(() => {
  const { notifications, isLoading } = useLatestNotifications()

  useEffect(() => {
    const count = notifications.reduce((acc, cur) => acc + (cur.seenAt ? 0 : 1), 0)
    notificationsCountEmitter.emit(count)
  }, [notifications])

  const items = useMemo(() => {
    return ['header', ...notifications, 'footer']
  }, [notifications])

  if (!notifications || notifications.length === 0) {
    if (isLoading) {
      return (
        <>
          <MessagesLoading />
          <Spacer flex />
        </>
      )
    }
    return (
      <YStack items="center" justify="center" py="$6">
        <SizableText fontFamily="$mono" color="$color11" opacity={0.5}>
          Nothing new!
        </SizableText>
      </YStack>
    )
  }

  return (
    <LegendList
      data={items}
      renderItem={ActivityItem}
      keyExtractor={activityKeyExtractor}
      estimatedItemSize={100}
      waitForInitialLayout={false}
      recycleItems
    />
  )
})

const activityKeyExtractor = (item: NotificationMessageWithRelations | string) =>
  typeof item === 'string' ? item : item.id

const ActivityItem = memo(
  ({ item }: { item: NotificationMessageWithRelations | string }) => {
    if (typeof item === 'string') {
      return <YStack key={item} height={8} />
    }

    const message = item.messages?.[0]

    if (!message) {
      return null
    }

    if (item.type === 'message') {
      if (isMessageNotification(item)) {
        return (
          <MessageItemMinimal
            key={item.id}
            linked="activity"
            message={{
              ...message,
              notification: item,
            }}
          />
        )
      }

      console.error('invalid notification')
      return null
    }

    if (isFriendshipNotification(item)) {
      return <FriendRequestNotification notification={item} />
    }

    return null
  }
)

const FriendRequestNotification = ({
  notification,
}: {
  notification: NotificationFriendship
}) => {
  // TODO
  return <SizableText>friend request!</SizableText>
}
