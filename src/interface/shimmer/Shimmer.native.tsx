import type React from 'react'
import { useContext, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated'
import { View } from 'tamagui'
import type { ShimmerNativeProps } from './Shimmer'
import { ShimmerContext } from './ShimmerContext'

export const Shimmer = ({ style, speed = 1 }: ShimmerNativeProps): React.ReactNode => {
  const shimmer = useContext(ShimmerContext)

  useEffect(() => {
    shimmer?.increaseActiveShimmers()
    return () => {
      shimmer?.decreaseActiveShimmers()
    }
  }, [shimmer])

  const animatedStyle = useAnimatedStyle(() => {
    const progress = (shimmer?.progress?.value ?? 0) * speed
    const opacity = interpolate(progress % 1, [0, 0.5, 1], [1, 0.1, 1])
    return {
      opacity,
    }
  })

  return (
    <View style={[styles.container, style as any]}>
      <Animated.View style={[styles.shimmerOverlay, animatedStyle]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
})
