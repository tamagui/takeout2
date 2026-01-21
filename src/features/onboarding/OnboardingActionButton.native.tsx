import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { SizableText, Stack, XStack, useTheme, type ColorTokens } from 'tamagui'

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
        <SizableText color={theme.color10?.val as ColorTokens} size="$4" fontWeight="500">
          Skip
        </SizableText>
      </Pressable>

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
        <Stack
          flex={1}
          items="center"
          justify="center"
          onPress={onPress}
          cursor="pointer"
        >
          <Animated.View style={[{ position: 'absolute' }, arrowAnimatedStyle]}>
            <CaretRightIcon size={28} color="white" />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, textAnimatedStyle]}>
            <SizableText
              color={theme.color6?.val as ColorTokens}
              size="$5"
              fontWeight="600"
            >
              Get Started
            </SizableText>
          </Animated.View>
        </Stack>
      </Animated.View>
    </XStack>
  )
}
