import { formatDistanceToNow } from '@take-out/helpers'
import { memo } from 'react'
import { SizableText, View, XStack, YStack } from 'tamagui'

import { scaleSize } from '~/helpers/scale/scaleSize'
import { BellIcon } from '~/interface/icons/phosphor/BellIcon'
import { ChatCircleIcon } from '~/interface/icons/phosphor/ChatCircleIcon'
import { Image } from '~/interface/image/Image'

import type { NotificationType } from '~/features/notification/types'

type NotificationListItemProps = {
  id: string
  actorName?: string
  actorImage?: string
  type: NotificationType
  title: string
  body?: string
  read: boolean
  createdAt: number
  onPress?: () => void
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'comment':
      return ChatCircleIcon
    default:
      return BellIcon
  }
}

export const NotificationListItem = memo(
  ({
    actorName,
    actorImage,
    type,
    title,
    body,
    read,
    createdAt,
    onPress,
  }: NotificationListItemProps) => {
    const Icon = getNotificationIcon(type)
    const timeAgo = formatDistanceToNow(createdAt)

    return (
      <XStack
        px="$4"
        py="$3"
        gap="$3"
        items="center"
        bg={read ? 'transparent' : '$background02'}
        hoverStyle={{ bg: '$background04' }}
        pressStyle={{ bg: '$background04' }}
        cursor="pointer"
        onPress={onPress}
      >
        <View position="relative">
          {actorImage ? (
            <View
              width={scaleSize(44)}
              height={scaleSize(44)}
              rounded="$10"
              overflow="hidden"
              bg="$color3"
            >
              <Image
                src={actorImage}
                width={scaleSize(44)}
                height={scaleSize(44)}
                objectFit="cover"
              />
            </View>
          ) : (
            <View
              width={scaleSize(44)}
              height={scaleSize(44)}
              rounded="$10"
              bg="$color5"
              items="center"
              justify="center"
            >
              <Icon size={20} />
            </View>
          )}
          {!read && (
            <View
              position="absolute"
              t={-2}
              r={-2}
              width={10}
              height={10}
              rounded="$10"
              bg="$blue10"
            />
          )}
        </View>

        <YStack flex={1} gap="$1">
          <XStack justify="space-between" items="center">
            <SizableText
              size="$4"
              color="$color12"
              fontWeight={read ? '400' : '600'}
              numberOfLines={1}
            >
              {actorName || title}
            </SizableText>
            <SizableText size="$2" color="$color10">
              {timeAgo}
            </SizableText>
          </XStack>
          {body && (
            <SizableText size="$3" color="$color11" numberOfLines={2}>
              {body}
            </SizableText>
          )}
        </YStack>
      </XStack>
    )
  }
)
