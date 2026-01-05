import { useEffect } from 'react'
import { TouchableOpacity } from 'react-native'
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

import { Pressable } from '~/interface/buttons/Pressable'

import type { IconComponent } from '~/interface/icons/types'

interface AnimatedTabProps {
  isFocused: boolean
  icon: IconComponent
  onPress: () => void
  onLongPress: () => void
  animationProgress: SharedValue<number>
}

export function AnimatedTab({
  isFocused,
  icon: Icon,
  onPress,
  onLongPress,
  animationProgress,
}: AnimatedTabProps) {
  const scale = useSharedValue(0)

  useEffect(() => {
    scale.value = withTiming(isFocused ? 1 : 0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    })
  }, [isFocused, scale])

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [0, 1])
    return {
      opacity,
      transform: [
        {
          scale: interpolate(scale.value, [0, 1], [0.8, 1]),
        },
      ],
    }
  })

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
    return {
      opacity,
      transform: [{ scale: counterScale }],
    }
  })

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      flex={1}
      items="center"
      justify="center"
      rounded={100}
      m={5}
      position="relative"
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 100,
            backgroundColor: 'rgba(126, 126, 126, 0.15)',
          },
          animatedBackgroundStyle,
        ]}
      />
      <Animated.View style={animatedIconStyle}>
        <Icon size={24} color={isFocused ? 'white' : '$color10'} />
      </Animated.View>
    </Pressable>
  )
}
