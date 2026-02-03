import { memo, useEffect } from 'react'
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

import { Button } from '../buttons/Button'

import type { IconComponent } from '~/interface/icons/types'

interface AnimatedTabProps {
  isFocused: boolean
  icon: IconComponent
  onPress: () => void
  onLongPress: () => void
  animationProgress: SharedValue<number>
}

export const AnimatedTab = memo(
  ({
    isFocused,
    icon: Icon,
    onPress,
    onLongPress,
    animationProgress,
  }: AnimatedTabProps) => {
    const focusProgress = useSharedValue(isFocused ? 1 : 0)

    useEffect(() => {
      focusProgress.value = withTiming(isFocused ? 1 : 0, {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    }, [isFocused, focusProgress])

    const animatedIconStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        animationProgress.value,
        [0, 0.25, 0.4],
        [1, 0.5, 0],
        Extrapolation.CLAMP
      )
      const counterScale = interpolate(
        animationProgress.value,
        [0, 0.5, 1],
        [1, 0.5, 1],
        Extrapolation.CLAMP
      )
      const iconScale = interpolate(focusProgress.value, [0, 1], [1, 1.1])
      return {
        opacity,
        transform: [{ scale: counterScale * iconScale }],
      }
    })

    return (
      <Button
        unstyled
        variant="transparent"
        onPress={onPress}
        onLongPress={onLongPress}
        flex={1}
        items="center"
        justify="center"
        rounded={100}
        haptic
        position="relative"
      >
        <Animated.View style={animatedIconStyle}>
          <Icon size={24} color={isFocused ? '$color' : '$color10'} />
        </Animated.View>
      </Button>
    )
  }
)
