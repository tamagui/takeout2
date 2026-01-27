import { useContext, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated'
import { View } from 'tamagui'

import { ShimmerContext } from './ShimmerContext'

import type { ShimmerNativeProps } from './Shimmer'
import type React from 'react'

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
    const opacity = interpolate(progress % 1, [0, 0.25, 1], [1, 0.05, 1])
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
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
})
