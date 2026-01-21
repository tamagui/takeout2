import './shimmer.css'

import { useLazyMount, getCurrentComponentStack } from '@take-out/helpers'
import { memo, useEffect, useRef } from 'react'
import { AnimatePresence, XStack, YStack } from 'tamagui'

import { animationClamped } from '../animations/animationClamped'
import { useShimmerEffect } from './ShimmerManager'

export interface ShimmerNativeProps {
  style?: any
  linearGradients?: string[]
  gradientStart?: { x: number; y: number }
  gradientEnd?: { x: number; y: number }
  easing?: any
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

  return (
    <XStack
      opacity={1}
      justify="center"
      items="center"
      contain="paint layout"
      transition={animationClamped('medium')}
      {...(!isMounted && {
        opacity: 0,
      })}
    >
      <AnimatePresence>
        {!disableShimmer && (
          <YStack
            key="shimmer"
            transition={animationClamped('medium')}
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
            transition={animationClamped('medium')}
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
