import { memo, useEffect } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

type SplashProps = {
  isReady: boolean
  onAnimationEnd: () => void
}

export const Splash = memo(({ onAnimationEnd, isReady }: SplashProps) => {
  const translateY = useSharedValue(0)
  const rotateZ = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { rotateZ: `${rotateZ.value}deg` }],
    }
  })

  useEffect(() => {
    if (isReady) {
      rotateZ.set(
        withDelay(
          500,
          withSequence(
            withTiming(-15, { duration: 80 }),
            withTiming(15, { duration: 80 }),
            withTiming(-10, { duration: 70 }),
            withTiming(10, { duration: 70 }),
            withTiming(-5, { duration: 60 }),
            withTiming(0, { duration: 60 })
          )
        )
      )
      translateY.set(
        withDelay(
          1000,
          withSequence(withTiming(-50), withTiming(Dimensions.get('window').height))
        )
      )
    }
    setTimeout(() => {
      onAnimationEnd()
    }, 1850)
  }, [rotateZ, translateY, isReady, onAnimationEnd])

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
