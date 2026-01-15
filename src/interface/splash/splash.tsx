import { memo, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useWindowDimensions } from 'tamagui'

type SplashProps = {
  isReady: boolean
  onAnimationEnd: () => void
}

export const Splash = memo(({ onAnimationEnd, isReady }: SplashProps) => {
  const { height } = useWindowDimensions()
  const translateY = useSharedValue(0)
  const rotate = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
    }
  })

  useEffect(() => {
    if (isReady) {
      rotate.value = withDelay(500, withSpring(360))
      translateY.value = withDelay(
        1000,
        withSequence(withTiming(-50), withTiming(height))
      )
    }
    setTimeout(() => {
      onAnimationEnd()
    }, 1850)
  }, [isReady])

  return (
    <Animated.View
      exiting={FadeOut}
      style={[
        StyleSheet.absoluteFillObject,
        {
          zIndex: 1000,
          backgroundColor: '#e6dac1',
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <Animated.Image
        source={require('../../../assets/logo.png')}
        style={[{ width: 80, height: 80 }, animatedStyle]}
      />
    </Animated.View>
  )
})
