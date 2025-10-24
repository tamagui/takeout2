import { AnimatePresence } from '@tamagui/animate-presence'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { type AnimationKeys, styled, useDebounce, View } from 'tamagui'
import { animationClamped } from './animationClamped'

interface AnimatedStepsProps {
  total: number
  current: number
  animation: AnimationKeys
  children: ReactNode
}

export const AnimatedSteps = ({
  total,
  current,
  animation,
  children,
}: AnimatedStepsProps) => {
  const [height, setHeight] = useState(0)
  const lastCurrent = useRef(current)

  // calculate going direction
  const going = current > lastCurrent.current ? 1 : current < lastCurrent.current ? -1 : 0

  useEffect(() => {
    lastCurrent.current = current
  }, [current])

  return (
    <View
      animateOnly={['height']}
      animation={animationClamped(animation)}
      height={Math.max(height, 100)}
    >
      <AnimatePresence initial={false} custom={{ going }}>
        <StepItem
          key={`step-${current}`}
          animation={animationClamped(animation)}
          going={going}
        >
          <View>
            <View
              position="absolute"
              inset={0}
              pointerEvents="none"
              onLayout={(e: LayoutChangeEvent) => {
                const measuredHeight = e.nativeEvent.layout.height
                setHeight(Math.round(measuredHeight))
              }}
            />
            {children}
          </View>
        </StepItem>
      </AnimatePresence>
    </View>
  )
}

const StepItem = styled(View, {
  inset: 0,
  position: 'absolute',
  x: 0,
  opacity: 1,

  variants: {
    going: {
      ':number': (going) => ({
        enterStyle: {
          x: going === 0 ? 0 : going > 0 ? 20 : -20,
          opacity: 0,
        },
        exitStyle: {
          zIndex: 0,
          x: going === 0 ? 0 : going < 0 ? 20 : -20,
          opacity: 0,
          pointerEvents: 'none',
        },
      }),
    },
  } as const,
})
