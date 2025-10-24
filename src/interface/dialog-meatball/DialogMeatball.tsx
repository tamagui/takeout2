import {
  Blur,
  Canvas,
  ColorMatrix,
  Group,
  Paint,
  RoundedRect,
} from '@shopify/react-native-skia'
import React, { useMemo, type ReactNode } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { runOnJS } from 'react-native-worklets'

export interface MeatballDialogProps {
  visible: boolean
  onClose: () => void
  minWidth?: number
  radius?: number
  color?: string
  children: ReactNode
  backgroundColor?: string
  contentPadding?: number
}
const SPRING_CONFIG = {
  damping: 18,
  mass: 0.5,
  stiffness: 180,
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Dynamic Island constants
const DYNAMIC_ISLAND_HEIGHT = 37
const DYNAMIC_ISLAND_WIDTH = 126
const DYNAMIC_ISLAND_Y = 18 // Position from top of screen
const DYNAMIC_ISLAND_X = (SCREEN_WIDTH - DYNAMIC_ISLAND_WIDTH) / 2

export function DialogMeatball({
  visible,
  onClose,
  minWidth = 280,
  radius = 16,
  color = 'white',
  children,
  backgroundColor = '#000000',
  contentPadding = 20,
}: MeatballDialogProps) {
  const { top } = useSafeAreaInsets()
  // State for measured content height
  const [contentHeight, setContentHeight] = React.useState(160)
  // State to track if dialog should be rendered (for animation completion)
  const [shouldRender, setShouldRender] = React.useState(false)

  // Target positions
  const centerX = (SCREEN_WIDTH - minWidth) / 2
  const centerY = (SCREEN_HEIGHT - contentHeight) / 2

  // Dialog position - animates from Dynamic Island to center
  const dialogX = useSharedValue(DYNAMIC_ISLAND_X)
  const dialogY = useSharedValue(DYNAMIC_ISLAND_Y)

  // Dialog size - animates from Dynamic Island size to full size
  const dialogWidth = useSharedValue(DYNAMIC_ISLAND_WIDTH)
  const dialogHeight = useSharedValue(DYNAMIC_ISLAND_HEIGHT)

  // Progress animation for close button visibility
  const progress = useSharedValue(0)

  // Function to trigger close from gesture (called from UI thread)
  const triggerClose = React.useCallback(() => {
    // Set shouldRender to false and call parent's onClose
    setShouldRender(false)
    onClose()
  }, [onClose])

  // Create gesture handler for dragging
  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet'
      // Update dialog position based on gesture
      dialogX.value = e.absoluteX - dialogWidth.value / 2
      dialogY.value = e.absoluteY - dialogHeight.value / 2
    })
    .onEnd((e) => {
      'worklet'

      // Calculate distance to Dynamic Island using ** operator instead of Math.pow
      const dx = e.absoluteX - SCREEN_WIDTH / 2
      const dy = e.absoluteY - (DYNAMIC_ISLAND_Y + DYNAMIC_ISLAND_HEIGHT / 2)
      const distanceToIsland = Math.sqrt(dx ** 2 + dy ** 2)

      if (distanceToIsland < 100) {
        // Animate to Dynamic Island and close
        dialogX.value = withTiming(DYNAMIC_ISLAND_X, {
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        dialogY.value = withTiming(DYNAMIC_ISLAND_Y, {
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        dialogWidth.value = withTiming(DYNAMIC_ISLAND_WIDTH, {
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        dialogHeight.value = withTiming(DYNAMIC_ISLAND_HEIGHT, {
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        progress.value = withTiming(
          0,
          {
            duration: 400,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          },
          () => {
            // Call close function after animation
            runOnJS(triggerClose)()
          }
        )
      } else {
        // Spring back to center
        dialogX.value = withSpring(centerX, SPRING_CONFIG)
        dialogY.value = withSpring(centerY, SPRING_CONFIG)
      }
    })

  // Handle visibility changes
  React.useEffect(() => {
    if (visible) {
      // Reset to initial state when becoming visible
      dialogX.value = DYNAMIC_ISLAND_X
      dialogY.value = DYNAMIC_ISLAND_Y
      dialogWidth.value = DYNAMIC_ISLAND_WIDTH
      dialogHeight.value = DYNAMIC_ISLAND_HEIGHT
      progress.value = 0

      // Show dialog - set render true and animate open
      setShouldRender(true)

      // Small delay to ensure state is set before animation
      setTimeout(() => {
        // Animate to center with full size using smooth timing for no bounce
        dialogX.value = withTiming(centerX, {
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        dialogY.value = withTiming(centerY, {
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        dialogWidth.value = withTiming(minWidth, {
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        dialogHeight.value = withTiming(contentHeight, {
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
        progress.value = withTiming(1, {
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      }, 50)
    } else if (shouldRender) {
      // Animate back to Dynamic Island before hiding
      dialogX.value = withTiming(DYNAMIC_ISLAND_X, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
      dialogY.value = withTiming(DYNAMIC_ISLAND_Y, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
      dialogWidth.value = withTiming(DYNAMIC_ISLAND_WIDTH, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
      dialogHeight.value = withTiming(DYNAMIC_ISLAND_HEIGHT, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
      progress.value = withTiming(0, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })

      // Hide dialog after animation completes
      setTimeout(() => {
        setShouldRender(false)
      }, 700)
    }
  }, [
    visible,
    shouldRender,
    dialogX,
    dialogY,
    dialogWidth,
    dialogHeight,
    centerX,
    centerY,
    minWidth,
    contentHeight,
    progress,
  ])

  // Create the paint layer with blur and color matrix for metaball effect
  const layer = useMemo(() => {
    return (
      <Paint>
        <Blur blur={30} />
        <ColorMatrix
          matrix={[
            1,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            0,
            60,
            -30, // Metaball effect threshold
          ]}
        />
      </Paint>
    )
  }, [])

  // Overlay animated style
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.6,
  }))

  // Content container animated style - keep full size but scale and position
  const contentStyle = useAnimatedStyle(() => {
    // Calculate scale based on current dialog size vs full size
    const scaleX = dialogWidth.value / minWidth
    const scaleY = dialogHeight.value / contentHeight
    const scale = Math.min(scaleX, scaleY)

    // Calculate position to align with dialog rectangle
    const translateX = dialogX.value + (dialogWidth.value - minWidth) / 2
    const translateY = dialogY.value + (dialogHeight.value - contentHeight) / 2

    const animatedRadius = interpolate(
      progress.value,
      [0, 1],
      [DYNAMIC_ISLAND_HEIGHT / 2, radius]
    )

    return {
      opacity: interpolate(progress.value, [0, 0.7, 1], [0, 0, 1]),
      transform: [{ translateX }, { translateY }, { scale }],
      width: minWidth,
      borderRadius: animatedRadius,
      backgroundColor: backgroundColor,
    }
  })

  if (!shouldRender) return null

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Overlay */}

      <Animated.View style={[styles.overlay, overlayStyle]} />

      <Canvas style={styles.canvas}>
        <Group layer={layer}>
          {/* Dynamic Island - fixed rectangle at top */}
          <RoundedRect
            x={DYNAMIC_ISLAND_X}
            y={DYNAMIC_ISLAND_Y}
            width={DYNAMIC_ISLAND_WIDTH}
            height={DYNAMIC_ISLAND_HEIGHT}
            r={DYNAMIC_ISLAND_HEIGHT / 2}
            color={color}
          />

          {/* Dialog rectangle - draggable */}
          <RoundedRect
            x={dialogX}
            y={dialogY}
            width={dialogWidth}
            height={dialogHeight}
            r={radius}
            color={color}
          />
        </Group>
      </Canvas>

      {/* Gesture detector wrapping content */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[styles.dialogContent, contentStyle]}
          pointerEvents="box-none"
        >
          <Animated.View
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout
              setContentHeight(height)
            }}
          >
            {children}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  dialogContent: {
    position: 'absolute',
    overflow: 'hidden',
  },
})
