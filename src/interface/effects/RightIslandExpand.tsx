import { Canvas, Path, Skia, Group, Mask, Rect } from '@shopify/react-native-skia'
import { forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useDerivedValue,
} from 'react-native-reanimated'

import type React from 'react'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface RightIslandProps {
  children?: React.ReactNode
  mainContent?: React.ReactNode
  springConfig?: {
    damping?: number
    stiffness?: number
    mass?: number
  }
}

export interface RightIslandRef {
  toggle: () => void
  open: () => void
  close: () => void
  expand: () => void
  collapse: () => void
  isOpen: boolean
  isExpanded: boolean
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
      isOpen.value = !isOpen.value
      progress.value = withSpring(isOpen.value ? 1 : 0, springConfig)
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
    }))

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
      // corner radius for expanded state (simple rounded corners)
      const expandedCornerR = e * 20

      const path = Skia.Path.Make()

      // Start from top-left
      path.moveTo(0, 0)

      // Top edge all the way to right
      path.lineTo(SCREEN_WIDTH, 0)

      // If island is open, create the curved cutout
      if (p > 0) {
        if (e > 0.8) {
          // When mostly expanded, use simple rounded rectangle
          const cornerR = expandedCornerR
          const left = SCREEN_WIDTH - curveDepth
          const top = islandY
          const bottom = islandY + islandHeight

          // Right edge down to top of island
          path.lineTo(SCREEN_WIDTH, top - cornerR)
          // Top-right corner
          path.quadTo(SCREEN_WIDTH, top, SCREEN_WIDTH - cornerR, top)
          // Top edge to left
          path.lineTo(left + cornerR, top)
          // Top-left corner
          path.quadTo(left, top, left, top + cornerR)
          // Left edge down
          path.lineTo(left, bottom - cornerR)
          // Bottom-left corner
          path.quadTo(left, bottom, left + cornerR, bottom)
          // Bottom edge to right
          path.lineTo(SCREEN_WIDTH - cornerR, bottom)
          // Bottom-right corner
          path.quadTo(SCREEN_WIDTH, bottom, SCREEN_WIDTH, bottom + cornerR)
          // Continue down
          path.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT)
        } else {
          // Original curved path for small/transitioning state
          path.lineTo(SCREEN_WIDTH, islandY - curveRadius * 1.5)

          // Top S-curve transition
          path.cubicTo(
            SCREEN_WIDTH,
            islandY - curveRadius,
            SCREEN_WIDTH - curveDepth + concaveR * 2,
            islandY - concaveR * 2,
            SCREEN_WIDTH - curveDepth + concaveR,
            islandY - concaveR
          )

          // Top concave corner
          path.quadTo(
            SCREEN_WIDTH - curveDepth,
            islandY,
            SCREEN_WIDTH - curveDepth,
            islandY + concaveR
          )

          // Straight section along the indent
          path.lineTo(SCREEN_WIDTH - curveDepth, islandY + islandHeight - concaveR)

          // Bottom concave corner
          path.quadTo(
            SCREEN_WIDTH - curveDepth,
            islandY + islandHeight,
            SCREEN_WIDTH - curveDepth + concaveR,
            islandY + islandHeight + concaveR
          )

          // Bottom S-curve transition back
          path.cubicTo(
            SCREEN_WIDTH - curveDepth + concaveR * 2,
            islandY + islandHeight + concaveR * 2,
            SCREEN_WIDTH,
            islandY + islandHeight + curveRadius,
            SCREEN_WIDTH,
            islandY + islandHeight + curveRadius * 1.5
          )

          // Continue down right edge to bottom
          path.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT)
        }
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
      const translateX = interpolate(progress.value, [0, 1], [CURVE_DEPTH + 20, 8])
      const opacity = interpolate(progress.value, [0.5, 1], [0, 1])

      // when expanded, bring to front (above MainContent)
      const zIndex = e > 0.1 ? 100 : 0
      const elevation = e > 0.1 ? 100 : 0 // for Android
      // background color transitions from transparent to black when expanding
      const bgOpacity = interpolate(e, [0, 0.3, 1], [0, 0, 1])

      return {
        width,
        height,
        top,
        transform: [{ translateX }],
        opacity,
        zIndex,
        elevation,
        backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
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

    // track if gesture already triggered to prevent multiple fires
    const gestureTriggered = useSharedValue(false)

    // Pan gesture for swipe to expand/collapse
    const panGesture = Gesture.Pan()
      .activeOffsetX([-20, 20]) // activate after 20px horizontal movement
      .onStart(() => {
        'worklet'
        gestureTriggered.value = false
      })
      .onUpdate((event) => {
        'worklet'
        // only allow swipe when island is open (progress > 0.5) and gesture not yet triggered
        if (progress.value < 0.5 || gestureTriggered.value) return

        const { translationX } = event
        const swipeThreshold = 50

        if (expansion.value > 0.5) {
          // when expanded, swipe right to collapse
          if (translationX > swipeThreshold) {
            gestureTriggered.value = true
            expansion.value = withSpring(0, springConfig)
          }
        } else {
          // when small, swipe left to expand
          if (translationX < -swipeThreshold) {
            gestureTriggered.value = true
            expansion.value = withSpring(1, springConfig)
          }
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

          {/* Island content - rendered after blue screen so it's on top when expanded */}
          <Animated.View
            style={[
              styles.contentContainer,
              contentContainerStyle,
              {
                right: 0,
                overflow: 'hidden',
              },
            ]}
            pointerEvents={isOpen.value ? 'auto' : 'none'}
          >
            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              {children}
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
