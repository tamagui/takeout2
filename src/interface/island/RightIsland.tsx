import type React from 'react'
import { forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { Canvas, Path, Skia, Group, Mask, Rect } from '@shopify/react-native-skia'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useDerivedValue,
} from 'react-native-reanimated'

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
  isOpen: boolean
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

    // Smaller dimensions for centered island
    const ISLAND_WIDTH = 70
    const CURVE_DEPTH = 30
    const ISLAND_HEIGHT = 160 // Compact height for middle section only
    const ISLAND_Y = (SCREEN_HEIGHT - ISLAND_HEIGHT) / 2 // Centered vertically

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
      progress.value = withSpring(0, springConfig)
    }

    useImperativeHandle(ref, () => ({
      toggle,
      open,
      close,
      get isOpen() {
        return isOpen.value
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
      const curveDepth = p * CURVE_DEPTH
      const curveRadius = 40 // Larger radius for smoother curves

      const path = Skia.Path.Make()

      // Start from top-left
      path.moveTo(0, 0)

      // Top edge all the way to right
      path.lineTo(SCREEN_WIDTH, 0)

      // If island is open, create the curved cutout ONLY in the middle
      if (p > 0) {
        // Right edge down to well before the island for smoother transition
        path.lineTo(SCREEN_WIDTH, ISLAND_Y - curveRadius * 1.5)

        // Top curve - smoother S-curve transition
        path.cubicTo(
          SCREEN_WIDTH,
          ISLAND_Y - curveRadius, // Control point 1 - start curving
          SCREEN_WIDTH - curveDepth * 0.3,
          ISLAND_Y - curveRadius * 0.7, // Control point 2
          SCREEN_WIDTH - curveDepth,
          ISLAND_Y // End point
        )

        // Straight section along the indent
        path.lineTo(SCREEN_WIDTH - curveDepth, ISLAND_Y + ISLAND_HEIGHT)

        // Bottom curve - smoother S-curve transition back
        path.cubicTo(
          SCREEN_WIDTH - curveDepth * 0.3,
          ISLAND_Y + ISLAND_HEIGHT + curveRadius * 0.7, // Control point 1
          SCREEN_WIDTH,
          ISLAND_Y + ISLAND_HEIGHT + curveRadius, // Control point 2
          SCREEN_WIDTH,
          ISLAND_Y + ISLAND_HEIGHT + curveRadius * 1.5 // End point - extend further
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
      // Move content completely off-screen when closed, into position when open
      const translateX = interpolate(progress.value, [0, 1], [CURVE_DEPTH + 20, 8])
      const opacity = interpolate(progress.value, [0.5, 1], [0, 1])

      return {
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

    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        {/* Content positioned behind everything */}
        <Animated.View
          style={[
            styles.contentContainer,
            contentContainerStyle,
            {
              width: CURVE_DEPTH, // Exact curve depth
              height: ISLAND_HEIGHT,
              top: ISLAND_Y,
              right: 0, // Positioned at edge
              overflow: 'hidden',
            },
          ]}
          pointerEvents={isOpen.value ? 'auto' : 'none'}
        >
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            {children}
          </Animated.View>
        </Animated.View>

        {/* Blue screen with curved cutout on top */}
        <View style={styles.screenContainer}>
          <Canvas style={styles.canvas}>
            <Path path={screenPath} color="#3B82F6" style="fill" />
          </Canvas>

          {/* Main content overlay */}
          <View style={styles.mainContentOverlay}>{mainContent}</View>
        </View>
      </View>
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
