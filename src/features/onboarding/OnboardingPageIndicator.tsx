import { memo } from 'react'
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import { useTheme, XStack } from 'tamagui'

interface OnboardingPageIndicatorProps {
  totalPages: number
  scrollPosition: SharedValue<number>
}

export const OnboardingPageIndicator = memo(function OnboardingPageIndicator({
  totalPages,
  scrollPosition,
}: OnboardingPageIndicatorProps) {
  const theme = useTheme()
  const activeColor = theme.color9?.get() ?? '#007AFF'
  const inactiveColor = theme.color5?.get() ?? '#E5E5EA'

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
})

interface IndicatorDotProps {
  index: number
  scrollPosition: SharedValue<number>
  activeColor: string
  inactiveColor: string
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
