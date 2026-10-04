import './shimmer.css'

import { useLazyMount, getCurrentComponentStack } from '@o/helpers'
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
            opacity="1 enter:0 exit:0"
            data-is-shimmer
          >
            <ShimmerInner />
          </YStack>
        )}

        {disableShimmer && (
          <YStack
            key="fallback"
            position="absolute"
            inset={0}
            transition={animationClamped('medium')}
            bg="color3"
            opacity="0.8 enter:0 exit:0"
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
