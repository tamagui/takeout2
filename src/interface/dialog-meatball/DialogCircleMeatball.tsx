import React, { useMemo } from 'react'
import { Dimensions, StatusBar, View } from 'react-native'
import {
  Blur,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  Paint,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useSharedValue, withSpring } from 'react-native-reanimated'

const RADIUS = 80
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export function DialogCircleMeatball() {
  // Use Reanimated's useSharedValue - Skia supports these directly
  const cx = useSharedValue(SCREEN_WIDTH / 2)
  const cy = useSharedValue(SCREEN_HEIGHT / 2)

  // Create gesture handler
  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet'
      // Update circle position based on absolute position
      cx.value = e.absoluteX
      cy.value = e.absoluteY
    })
    .onEnd(() => {
      'worklet'
      // Spring back to center
      cx.value = withSpring(SCREEN_WIDTH / 2, {
        damping: 10,
        stiffness: 100,
      })
      cy.value = withSpring(SCREEN_HEIGHT / 2, {
        damping: 10,
        stiffness: 100,
      })
    })

  // Create the paint layer with blur and color matrix for metaball effect
  const layer = useMemo(() => {
    return (
      <Paint>
        <Blur blur={30} />
        <ColorMatrix
          matrix={[
            // R, G, B, A, Bias
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

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: 'pink' }}>
        <Canvas style={{ flex: 1 }}>
          <Group layer={layer}>
            {/* Moving circle - Skia accepts Reanimated values directly */}
            <Circle cx={cx} cy={cy} r={RADIUS} color="white" />

            {/* Fixed center circle */}
            <Circle
              cx={SCREEN_WIDTH / 2}
              cy={SCREEN_HEIGHT / 2}
              r={RADIUS}
              color="white"
            />

            {/* Gradient overlay for visual effect */}
            <SweepGradient
              c={vec(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2)}
              colors={['cyan', 'magenta', 'cyan']}
            />
          </Group>
        </Canvas>

        {/* Gesture detector overlay */}
        <GestureDetector gesture={gesture}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
        </GestureDetector>
      </View>
    </>
  )
}
