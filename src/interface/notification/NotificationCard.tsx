import { memo } from 'react'
import { SizableText, View, XStack, YStack } from 'tamagui'

import { scaleSize } from '~/helpers/scale/scaleSize'
import { GlassView } from '~/interface/effects/GlassView'
import { Image } from '~/interface/image/Image'

import type { NotificationCardProps } from '~/features/notification/types'

export const NOTIFICATION_CARD_HEIGHT = 80
export const NOTIFICATION_CARD_GAP = 8

export const NotificationCard = memo(
  ({ notification, index, isSpread, totalCount }: NotificationCardProps) => {
    const finalY = index * (NOTIFICATION_CARD_HEIGHT + NOTIFICATION_CARD_GAP)
    const stackedY = index * 8
    const stackedRotate = -5 + index * 2
    const stackedScale = 0.95

    return (
      <YStack
        position="absolute"
        width="100%"
        transition={['250ms', { delay: index * 100 }]}
        y={isSpread ? finalY : stackedY}
        rotate={isSpread ? '0deg' : `${stackedRotate}deg`}
        scale={isSpread ? 1 : stackedScale}
        opacity={1}
        px="$4"
        enterStyle={{
          opacity: 0,
          scale: 0.9,
        }}
        z={totalCount - index}
      >
        <GlassView borderRadius={12} intensity={40} isFallback>
          <XStack
            overflow="hidden"
            rounded={12}
            bg="$background06"
            backdropFilter="blur(20px)"
            items="center"
            px="$3"
            height={NOTIFICATION_CARD_HEIGHT}
            position="relative"
          >
            <View
              width={scaleSize(36)}
              height={scaleSize(36)}
              rounded="$10"
              overflow="hidden"
              bg="$color3"
            >
              <Image
                src={notification.avatar}
                width={scaleSize(36)}
                height={scaleSize(36)}
                objectFit="cover"
              />
            </View>

            <YStack flex={1} ml="$3" justify="center">
              <XStack justify="space-between">
                <SizableText size="$4" color="$color12" fontWeight="500">
                  {notification.name}
                </SizableText>
                <SizableText size="$3" opacity={0.6} color="$color11" fontWeight="500">
                  {notification.time}
                </SizableText>
              </XStack>
              <SizableText size="$3" color="$color11" fontWeight="500">
                {notification.message}
              </SizableText>
            </YStack>
          </XStack>
        </GlassView>
      </YStack>
    )
  }
)
