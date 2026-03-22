import { isAndroid } from '@take-out/helpers'
import { memo } from 'react'
import { View } from 'tamagui'

import { BlurView } from '~/interface/effects/BlurView'

import type { GlassViewProps } from './types'

export const GlassView = memo(
  ({
    borderRadius = 16,
    intensity = 40,
    tint,
    containerStyle,
    children,
    isFallback,
    backgroundColor = 'rgba(255, 255, 255, 0.05)',
    isInteractive = true,
  }: GlassViewProps) => {
    // android fallback
    if (isAndroid) {
      return (
        <View bg="$color4" style={[{ borderRadius, overflow: 'hidden' }, containerStyle]}>
          {children}
        </View>
      )
    }

    // expo-blur fallback
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          {
            overflow: 'hidden',
            borderRadius,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          },
          containerStyle as any,
        ]}
      >
        {children}

        <View
          position="absolute"
          z={1}
          t={0}
          l={0}
          r={0}
          b={0}
          rounded={borderRadius}
          bg={backgroundColor as any}
          pointerEvents={isInteractive ? 'none' : 'auto'}
        />
      </BlurView>
    )
  },
)
