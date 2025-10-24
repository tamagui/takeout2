import { AnimatedMeshGradient } from 'expo-ios-mesh-gradient'
import { memo, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  FadeInDown,
} from 'react-native-reanimated'
import { View, YStack } from 'tamagui'
import { kHeight, kWidth } from '~/constants/deviceSizes'

interface SiriMeshGradientProps {
  visible: boolean
  onClose: () => void
  startPosition?: { x: number; y: number }
}

const COLORS = ['#FFE097', '#7873f5', '#000000']

export const SiriMeshGradient = memo(
  ({ visible, onClose, startPosition }: SiriMeshGradientProps) => {
    // First ripple animation values
    const rippleScale = useSharedValue(0)
    const rippleOpacity = useSharedValue(0)

    // Second ripple animation values
    const rippleScale2 = useSharedValue(0)
    const rippleOpacity2 = useSharedValue(0)

    const centerX = useSharedValue(startPosition?.x || kWidth / 2)
    const centerY = useSharedValue(startPosition?.y || kHeight / 2)

    // Edge glow visibility
    const edgeGlowOpacity = useSharedValue(0)

    // Calculate ripple sizes - second one is smaller
    const rippleSize = Math.max(kWidth, kHeight) * 2
    const rippleSize2 = Math.max(kWidth, kHeight) * 1.5 // Smaller size for inner ripple

    useEffect(() => {
      if (visible) {
        // Update center position if provided
        if (startPosition) {
          centerX.value = startPosition.x
          centerY.value = startPosition.y
        }

        // Start with center ripple animation
        rippleScale.value = 0
        rippleOpacity.value = 1
        rippleScale2.value = 0
        rippleOpacity2.value = 0
        edgeGlowOpacity.value = 0

        // Animate both ripples together from the button position
        rippleScale.value = withTiming(2, { duration: 800 })
        rippleOpacity.value = withTiming(0, { duration: 800 })

        // Second ripple animates at the same time but with different opacity
        rippleScale2.value = withTiming(2, { duration: 800 })
        rippleOpacity2.value = withSequence(
          withTiming(0.8, { duration: 100 }),
          withTiming(0, { duration: 700 })
        )

        // Show edge glow after ripple starts (500ms delay)
        edgeGlowOpacity.value = withDelay(500, withTiming(1, { duration: 300 }))

        // Auto-hide after 5 seconds
        setTimeout(() => {
          edgeGlowOpacity.value = withTiming(0, { duration: 300 })
          setTimeout(() => {
            onClose()
          }, 300)
        }, 5000)
      } else {
        // Reset all animations when not visible
        rippleScale.value = 0
        rippleOpacity.value = 0
        rippleScale2.value = 0
        rippleOpacity2.value = 0
        edgeGlowOpacity.value = 0
      }
    }, [
      visible,
      rippleScale,
      rippleOpacity,
      rippleScale2,
      rippleOpacity2,
      edgeGlowOpacity,
      onClose,
      startPosition,
      centerX,
      centerY,
    ])

    const tap = Gesture.Tap().onStart((event) => {
      // Set ripple center to tap location
      centerX.value = event.x
      centerY.value = event.y

      // Reset and start both ripples together
      rippleScale.value = 0
      rippleOpacity.value = 1
      rippleScale2.value = 0
      rippleOpacity2.value = 0.8

      // Animate both at the same time
      rippleScale.value = withTiming(1, { duration: 1000 })
      rippleOpacity.value = withTiming(0, { duration: 1000 })
      rippleScale2.value = withTiming(1, { duration: 1000 })
      rippleOpacity2.value = withTiming(0, { duration: 1000 })
    })

    const rippleAnimatedStyle = useAnimatedStyle(() => {
      const scale = rippleScale.value
      return {
        width: rippleSize,
        height: rippleSize,
        borderRadius: rippleSize / 2,
        transform: [{ scale }],
        opacity: rippleOpacity.value,
        position: 'absolute',
        top: centerY.value - rippleSize / 2,
        left: centerX.value - rippleSize / 2,
        backgroundColor: 'rgba(120, 115, 245, 0.3)',
      }
    })

    const rippleAnimatedStyle2 = useAnimatedStyle(() => {
      const scale = rippleScale2.value
      return {
        width: rippleSize2,
        height: rippleSize2,
        borderRadius: rippleSize2 / 2,
        transform: [{ scale }],
        opacity: rippleOpacity2.value,
        position: 'absolute',
        top: centerY.value - rippleSize2 / 2,
        left: centerX.value - rippleSize2 / 2,
        backgroundColor: 'rgba(255, 224, 151, 0.4)', // Different color for inner ripple
      }
    })

    const edgeGlowAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: edgeGlowOpacity.value,
      }
    })

    if (!visible) return null

    return (
      <GestureDetector gesture={tap}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <YStack style={[StyleSheet.absoluteFillObject]}>
            {/* Dark backdrop */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                edgeGlowAnimatedStyle,
              ]}
            />

            {/* Tap ripple effects - larger one first, smaller on top */}
            <Animated.View style={rippleAnimatedStyle} pointerEvents="none" />
            <Animated.View style={rippleAnimatedStyle2} pointerEvents="none" />

            {/* Edge glows with animated opacity */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                edgeGlowAnimatedStyle,
                {
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
              pointerEvents="none"
            >
              <Animated.Text
                entering={FadeInDown.delay(1000)}
                style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}
              >
                ASK HUB...
              </Animated.Text>

              {/* Top edge glow */}
              <View style={styles.topGradient} pointerEvents="none">
                <AnimatedMeshGradient
                  columns={3}
                  rows={2}
                  colors={COLORS}
                  smoothsColors
                  animated
                  animationSpeed={0.001}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
              {/* Bottom edge glow */}
              <View style={styles.bottomGradient} pointerEvents="none">
                <AnimatedMeshGradient
                  columns={3}
                  rows={2}
                  colors={COLORS}
                  smoothsColors
                  animated
                  animationSpeed={0.01}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
              {/* Left edge glow */}
              <View style={styles.leftGradient} pointerEvents="none">
                <AnimatedMeshGradient
                  columns={3}
                  rows={2}
                  colors={COLORS}
                  smoothsColors
                  animated
                  animationSpeed={0.01}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
              <View style={styles.rightGradient} pointerEvents="none">
                <AnimatedMeshGradient
                  columns={3}
                  rows={2}
                  colors={COLORS}
                  smoothsColors
                  animated
                  animationSpeed={0.01}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            </Animated.View>
          </YStack>
        </Animated.View>
      </GestureDetector>
    )
  }
)

const styles = StyleSheet.create({
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    transform: [{ rotate: '180deg' }],
  },
  leftGradient: {
    position: 'absolute',
    width: kHeight,
    height: 100,
    bottom: 0,
    left: -kHeight / 2 + 50,
    top: kHeight / 2 - 50,
    transform: [{ rotate: '-90deg' }],
  },
  rightGradient: {
    position: 'absolute',
    width: kHeight,
    height: 100,
    bottom: 0,
    right: -kHeight / 2 + 50,
    top: kHeight / 2 - 50,
    transform: [{ rotate: '90deg' }],
  },
})
