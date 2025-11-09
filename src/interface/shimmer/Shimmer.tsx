import { memo, useEffect, useRef } from 'react'
import { AnimatePresence, XStack, YStack, type ViewStyle } from 'tamagui'
import { useLazyMount } from '@take-out/helpers'
import { getCurrentComponentStack } from '@take-out/helpers'
import { animationClamped } from '../animations/animationClamped'
import { useShimmerEffect } from './ShimmerManager'
import type { EasingFunction } from 'react-native-reanimated'

export interface ShimmerNativeProps {
  style?: ViewStyle | ViewStyle[]
  linearGradients?: string[]
  gradientStart?: { x: number; y: number }
  gradientEnd?: { x: number; y: number }
  easing?: EasingFunction
  speed?: number
}

export const Shimmer = memo(() => {
  const isMounted = useLazyMount()

  // shimmer is expensive, if it accidentally is mounted we should clear it
  const disableShimmer = useLazyMount({
    min: 4000,
  })

  const name = getCurrentComponentStack('short')

  useEffect(() => {
    if (disableShimmer) {
      console.warn(`‼️ disabled shimmer effect after 4 seconds`, name)
    }
  }, [disableShimmer, name])

  // Use the shared shimmer effect

  return (
    <XStack
      opacity={1}
      fullscreen
      justify="center"
      items="center"
      contain="paint layout"
      animation={animationClamped('medium')}
      {...(!isMounted && {
        opacity: 0,
      })}
    >
      <AnimatePresence>
        {!disableShimmer && (
          <YStack
            key="shimmer"
            animation={animationClamped('medium')}
            data-is-shimmer
            opacity={1}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          >
            <ShimmerInner />
          </YStack>
        )}

        {disableShimmer && (
          <YStack
            key="fallback"
            fullscreen
            animation={animationClamped('medium')}
            bg="$color3"
            opacity={0.8}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </XStack>
  )
})

const ShimmerInner = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useShimmerEffect(canvasRef, {
    cols: 200,
    rows: 50,
    width: 1000,
    height: 200,
  })

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={200}
      style={{
        imageRendering: 'pixelated',
      }}
    />
  )
})
