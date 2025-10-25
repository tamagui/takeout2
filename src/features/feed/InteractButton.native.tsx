// Using .native because lottie-react-native

import LottieView from 'lottie-react-native'
import type { RefObject } from 'react'
import { SizableText, XStack } from 'tamagui'
import { Pressable } from '~/interface/buttons/Pressable'
import type { IconProps } from '~/interface/icons/types'

export interface InteractButtonProps {
  icon: React.ComponentType<IconProps>
  count: number
  onPress?: () => void
  active?: boolean
  lottieSource?: any
  lottieRef?: RefObject<LottieView | null>
  lottieScale?: number
}

export function InteractButton({
  icon: Icon,
  count,
  onPress,
  active = false,
  lottieSource,
  lottieRef,
  lottieScale = 2.5,
}: InteractButtonProps) {
  const formatReactionCount = (count: number) => {
    if (count >= 1000) {
      return `${Math.floor(count / 100) / 10}k`
    }
    return count.toString()
  }

  return (
    <XStack items="center" gap="$1.5">
      <Pressable items="center" justify="center" onPress={onPress}>
        <Icon size={22} color="$color11" opacity={active && lottieSource ? 0 : 1} />
        {lottieSource && (
          <LottieView
            ref={lottieRef}
            autoPlay={false}
            loop={false}
            source={lottieSource}
            style={{
              width: 22,
              height: 22,
              position: 'absolute',
              transform: [{ scale: lottieScale }],
              // Hide when not active, but keep mounted
              opacity: active ? 1 : 0,
            }}
          />
        )}
      </Pressable>
      <SizableText minW={14} size="$3" fontWeight="600">
        {formatReactionCount(count)}
      </SizableText>
    </XStack>
  )
}
