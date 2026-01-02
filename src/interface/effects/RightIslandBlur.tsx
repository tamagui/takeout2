import { Canvas, Path, Skia } from '@shopify/react-native-skia'
import { BlurView } from 'expo-blur'
import { forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  interpolate,
  useDerivedValue,
} from 'react-native-reanimated'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

import type React from 'react'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface RightIslandProps {
  children?: React.ReactNode | ((expansionValue: SharedValue<number>) => React.ReactNode)
  mainContent?: React.ReactNode
  springConfig?: {
    damping?: number
    stiffness?: number
    mass?: number
  }
}

import type { SharedValue } from 'react-native-reanimated'

export interface RightIslandRef {
  toggle: () => void
  open: () => void
  close: () => void
  expand: () => void
  collapse: () => void
  isOpen: boolean
  isExpanded: boolean
  /** Shared value for expansion animation (0 = collapsed, 1 = expanded) */
  expansionValue: SharedValue<number>
}

export const RightIsland = forwardRef<RightIslandRef, RightIslandProps>(
  (
    {
      children,
      mainContent,
      springConfig = {
        damping: 25,
        stiffness: 150,
        mass: 0.8,
      },
    },
    ref
  ) => {
    const progress = useSharedValue(0)
    const isOpen = useSharedValue(false)
    const expansion = useSharedValue(0) // 0 = small island, 1 = full width
    const isExpandedState = useSharedValue(false)

    // Smaller dimensions for centered island
    const ISLAND_WIDTH = 70
    const CURVE_DEPTH = 30
    const ISLAND_HEIGHT = 160 // Compact height for middle section only
    const ISLAND_Y = (SCREEN_HEIGHT - ISLAND_HEIGHT) / 2 // Centered vertically
    const FULL_WIDTH = SCREEN_WIDTH // full screen width

    const toggle = () => {
      const newIsOpen = !isOpen.value
      isOpen.value = newIsOpen
      progress.value = withSpring(newIsOpen ? 1 : 0, springConfig)
    }

    const open = () => {
      isOpen.value = true
      progress.value = withSpring(1, springConfig)
    }

    const close = () => {
      isOpen.value = false
      isExpandedState.value = false
      expansion.value = withSpring(0, springConfig)
      progress.value = withSpring(0, springConfig)
    }

    const expand = () => {
      if (isOpen.value) {
        console.log('expand')
        isExpandedState.value = true
        expansion.value = withSpring(1, springConfig)
      }
    }

    const collapse = () => {
      console.log('collapse')
      isExpandedState.value = false
      expansion.value = withSpring(0, springConfig)
    }

    useImperativeHandle(ref, () => ({
      toggle,
      open,
      close,
      expand,
      collapse,
      get isOpen() {
        return isOpen.value
      },
      get isExpanded() {
        return isExpandedState.value
      },
      expansionValue: expansion,
    }))

    // Blur intensity - animates based on expansion (0 when closed, 80 when expanded)
    const blurAnimatedProps = useAnimatedProps(() => {
      const intensity = interpolate(expansion.value, [0, 1], [0, 80])
      return { intensity }
    })

    // Create mask path for content clipping
    const contentMaskPath = useDerivedValue(() => {
      const p = progress.value
      const islandWidth = p * ISLAND_WIDTH
      const curveDepth = p * CURVE_DEPTH
      const curveRadius = 35

      const path = Skia.Path.Make()

      if (p > 0) {
        // Start from right edge where curve begins
        path.moveTo(SCREEN_WIDTH - islandWidth, ISLAND_Y - curveRadius)

        // Top curve
        path.cubicTo(
          SCREEN_WIDTH - islandWidth,
          ISLAND_Y - curveRadius * 0.5,
          SCREEN_WIDTH - islandWidth - curveDepth * 0.3,
          ISLAND_Y - curveRadius * 0.5,
          SCREEN_WIDTH - islandWidth - curveDepth,
          ISLAND_Y
        )

        // Left edge
        path.lineTo(SCREEN_WIDTH - islandWidth - curveDepth, ISLAND_Y + ISLAND_HEIGHT)

        // Bottom curve
        path.cubicTo(
          SCREEN_WIDTH - islandWidth - curveDepth * 0.3,
          ISLAND_Y + ISLAND_HEIGHT + curveRadius * 0.5,
          SCREEN_WIDTH - islandWidth,
          ISLAND_Y + ISLAND_HEIGHT + curveRadius * 0.5,
          SCREEN_WIDTH - islandWidth,
          ISLAND_Y + ISLAND_HEIGHT + curveRadius
        )

        // Right edge
        path.lineTo(SCREEN_WIDTH, ISLAND_Y + ISLAND_HEIGHT + curveRadius)
        path.lineTo(SCREEN_WIDTH, ISLAND_Y - curveRadius)

        path.close()
      }

      return path
    })

    // Create the blue screen path with curved cutout
    const screenPath = useDerivedValue(() => {
      const p = progress.value
      const e = expansion.value
      // interpolate depth based on expansion (small → full width)
      const baseDepth = p * CURVE_DEPTH
      const expandedDepth = FULL_WIDTH
      const curveDepth = baseDepth + e * (expandedDepth - baseDepth)
      // interpolate height based on expansion (small → full height)
      const baseHeight = ISLAND_HEIGHT
      const expandedHeight = SCREEN_HEIGHT // full screen height
      const islandHeight = baseHeight + e * (expandedHeight - baseHeight)
      // interpolate Y position (centered → top of screen)
      const baseY = ISLAND_Y
      const expandedY = 0 // start at very top
      const islandY = baseY + e * (expandedY - baseY)

      // reduce curves when expanded (1 - e means curves disappear as e approaches 1)
      const curveFactor = 1 - e
      const curveRadius = 40 * curveFactor
      const concaveR = Math.pow(p, 0.7) * 10 * curveFactor

      const path = Skia.Path.Make()

      // Start from top-left
      path.moveTo(0, 0)

      // Top edge all the way to right
      path.lineTo(SCREEN_WIDTH, 0)

      // If island is open, create the curved cutout
      if (p > 0) {
        // Use a single smooth path that works for all expansion values
        // Curves naturally flatten as curveFactor approaches 0
        const safeRadius = Math.max(curveRadius, 0.1)
        const safeConcaveR = Math.max(concaveR, 0.1)

        path.lineTo(SCREEN_WIDTH, islandY - safeRadius * 1.5)

        // Top S-curve transition
        path.cubicTo(
          SCREEN_WIDTH,
          islandY - safeRadius,
          SCREEN_WIDTH - curveDepth + safeConcaveR * 2,
          islandY - safeConcaveR * 2,
          SCREEN_WIDTH - curveDepth + safeConcaveR,
          islandY - safeConcaveR
        )

        // Top concave corner
        path.quadTo(
          SCREEN_WIDTH - curveDepth,
          islandY,
          SCREEN_WIDTH - curveDepth,
          islandY + safeConcaveR
        )

        // Straight section along the indent
        path.lineTo(SCREEN_WIDTH - curveDepth, islandY + islandHeight - safeConcaveR)

        // Bottom concave corner
        path.quadTo(
          SCREEN_WIDTH - curveDepth,
          islandY + islandHeight,
          SCREEN_WIDTH - curveDepth + safeConcaveR,
          islandY + islandHeight + safeConcaveR
        )

        // Bottom S-curve transition back
        path.cubicTo(
          SCREEN_WIDTH - curveDepth + safeConcaveR * 2,
          islandY + islandHeight + safeConcaveR * 2,
          SCREEN_WIDTH,
          islandY + islandHeight + safeRadius,
          SCREEN_WIDTH,
          islandY + islandHeight + safeRadius * 1.5
        )

        // Continue down right edge to bottom
        path.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT)
      } else {
        // No island - straight edge
        path.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT)
      }

      // Bottom edge
      path.lineTo(0, SCREEN_HEIGHT)

      // Close the path
      path.close()

      return path
    })

    // Animation for content positioned in the cutout
    const contentContainerStyle = useAnimatedStyle(() => {
      const e = expansion.value
      // interpolate dimensions based on expansion
      const baseWidth = CURVE_DEPTH
      const expandedWidth = FULL_WIDTH
      const width = baseWidth + e * (expandedWidth - baseWidth)

      const baseHeight = ISLAND_HEIGHT
      const expandedHeight = SCREEN_HEIGHT // full screen height
      const height = baseHeight + e * (expandedHeight - baseHeight)

      const baseTop = ISLAND_Y
      const expandedTop = 0 // start at very top
      const top = baseTop + e * (expandedTop - baseTop)

      // Move content completely off-screen when closed, into position when open
      const baseTranslateX = interpolate(progress.value, [0, 1], [CURVE_DEPTH + 20, 8])
      // When expanded, translateX goes to 0 for full screen
      const translateX = interpolate(e, [0, 1], [baseTranslateX, 0])
      const opacity = interpolate(progress.value, [0.5, 1], [0, 1])

      return {
        width,
        height,
        top,
        transform: [{ translateX }],
        opacity,
      }
    })

    // Animation for content items
    const contentAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(progress.value, [0.7, 1], [0, 1])
      const scale = interpolate(progress.value, [0, 1], [0.95, 1])
      return {
        opacity,
        transform: [{ scale }],
      }
    })

    // track starting expansion value when gesture begins
    const startExpansion = useSharedValue(0)
    const SWIPE_DISTANCE = 200 // pixels to swipe for full expand/collapse

    // Pan gesture for swipe to expand/collapse
    const panGesture = Gesture.Pan()
      .activeOffsetX([-20, 20]) // activate after 20px horizontal movement
      .failOffsetY([-15, 15]) // fail if user scrolls vertically first, allowing ScrollView to work
      .onStart(() => {
        'worklet'
        startExpansion.value = expansion.value
      })
      .onUpdate((event) => {
        'worklet'
        // only allow swipe when island is open
        if (progress.value < 0.5) return

        const { translationX } = event
        // swipe left (negative) to expand, swipe right (positive) to collapse
        const delta = -translationX / SWIPE_DISTANCE
        const newExpansion = startExpansion.value + delta
        // clamp between 0 and 1
        expansion.value = Math.max(0, Math.min(1, newExpansion))
      })
      .onEnd((event) => {
        'worklet'
        if (progress.value < 0.5) return

        const { velocityX } = event
        const velocityThreshold = 500

        // snap based on velocity or current position
        if (Math.abs(velocityX) > velocityThreshold) {
          // fast swipe - use velocity direction
          expansion.value = withSpring(velocityX < 0 ? 1 : 0, springConfig)
        } else {
          // slow swipe - snap to nearest
          expansion.value = withSpring(expansion.value > 0.5 ? 1 : 0, springConfig)
        }
      })

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, { backgroundColor: '#000' }]}>
          {/* Blue screen with curved cutout */}
          <View style={styles.screenContainer}>
            <Canvas style={styles.canvas}>
              <Path path={screenPath} color="#3B82F6" style="fill" />
            </Canvas>

            {/* Main content overlay */}
            <View style={styles.mainContentOverlay}>{mainContent}</View>
          </View>

          {/* Blur overlay - between mainContent and island, only blurs mainContent */}
          <Animated.View
            style={[StyleSheet.absoluteFill, { zIndex: 50 }]}
            pointerEvents="none"
          >
            <AnimatedBlurView
              animatedProps={blurAnimatedProps}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Island content - always on top with highest z-index */}
          <Animated.View
            style={[
              styles.contentContainer,
              contentContainerStyle,
              {
                right: 0,
                overflow: 'hidden',
                zIndex: 100,
              },
            ]}
            pointerEvents="box-none"
          >
            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              {typeof children === 'function' ? children(expansion) : children}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    )
  }
)

RightIsland.displayName = 'RightIsland'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  screenContainer: {
    flex: 1,
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
  mainContentOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
  },
  contentContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    backgroundColor: 'transparent',
  },
})
