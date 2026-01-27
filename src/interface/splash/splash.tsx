import { memo, useEffect } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

type SplashProps = {
  isReady: boolean
  onAnimationEnd: () => void
}

export const Splash = memo(({ onAnimationEnd, isReady }: SplashProps) => {
  const translateY = useSharedValue(0)
  const rotateY = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { translateY: translateY.value },
        { rotateY: `${rotateY.value}deg` },
      ],
    }
  })

  useEffect(() => {
    if (isReady) {
      rotateY.set(withDelay(500, withSpring(360, { damping: 12, stiffness: 80 })))
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
  }, [rotateY, translateY, isReady, onAnimationEnd])

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
