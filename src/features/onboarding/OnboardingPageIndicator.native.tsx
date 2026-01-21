import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { useTheme, XStack } from 'tamagui'

import type { IndicatorDotProps, OnboardingPageIndicatorProps } from './types'

export function OnboardingPageIndicator({
  totalPages,
  scrollPosition,
}: OnboardingPageIndicatorProps) {
  const theme = useTheme()
  const activeColor = theme.color9?.val ?? '#888'
  const inactiveColor = theme.color5?.val ?? '#444'

  if (!scrollPosition) return null

  return (
    <XStack gap={8} justify="center" items="center" py="$3">
      {Array.from({ length: totalPages }).map((_, idx) => (
        <IndicatorDot
          key={idx}
          index={idx}
          scrollPosition={scrollPosition}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </XStack>
  )
}

function IndicatorDot({
  index,
  scrollPosition,
  activeColor,
  inactiveColor,
}: IndicatorDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollPosition.value - index)

    const width = interpolate(distance, [0, 0.5, 1], [28, 14, 8], Extrapolation.CLAMP)

    const backgroundColor = interpolateColor(
      distance,
      [0, 1],
      [activeColor, inactiveColor]
    )

    const scale = interpolate(distance, [0, 0.2, 1], [1, 1.15, 1], Extrapolation.CLAMP)

    return {
      width,
      backgroundColor,
      transform: [{ scale }],
    }
  })

  return (
    <Animated.View style={[{ width: 8, height: 8, borderRadius: 4 }, animatedStyle]} />
  )
}
