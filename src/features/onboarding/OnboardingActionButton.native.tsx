import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { SizableText, XStack, useTheme, type ColorTokens } from 'tamagui'

import { Pressable } from '~/interface/buttons/Pressable'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'

import type { OnboardingActionButtonProps } from './types'

export function OnboardingActionButton({
  isLastPage = false,
  onPress,
  onSkip,
}: OnboardingActionButtonProps) {
  const theme = useTheme()

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isLastPage ? 200 : 56),
      borderRadius: withTiming(isLastPage ? 16 : 28),
      backgroundColor: withTiming(isLastPage ? theme.color10?.val : theme.color9?.val),
    }
  }, [isLastPage, theme.color9?.val, theme.color10?.val])

  const arrowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLastPage ? 0 : 1),
    }
  }, [isLastPage])

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLastPage ? 1 : 0),
    }
  }, [isLastPage])

  return (
    <XStack justify="space-between" items="center" width="100%">
      <Pressable
        onPress={onSkip}
        hitSlop={12}
        cursor="pointer"
        opacity={isLastPage ? 0 : 1}
        disabled={isLastPage}
      >
        <SizableText color="$color10" size="$4" fontWeight="500">
          Skip
        </SizableText>
      </Pressable>
      <Pressable onPress={onPress} hitSlop={12}>
        <Animated.View
          style={[
            {
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            },
            buttonAnimatedStyle,
          ]}
        >
          <Animated.View style={[{ position: 'absolute' }, arrowAnimatedStyle]}>
            <CaretRightIcon size={28} color="white" />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, textAnimatedStyle]}>
            <SizableText size="$5" fontWeight="600" color="$color8">
              Get Started
            </SizableText>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </XStack>
  )
}
