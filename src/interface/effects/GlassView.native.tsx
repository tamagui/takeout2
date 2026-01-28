import { isAndroid } from '@take-out/helpers'
import { GlassView as ExpoGlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
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
    glassEffectStyle = 'clear',
    isFallback,
    backgroundColor = 'rgba(255, 255, 255, 0.05)',
    tintColor,
    isInteractive = true,
  }: GlassViewProps) => {
    // use expo-glass-effect for iOS 26+
    if (isLiquidGlassAvailable() && !isFallback) {
      return (
        <ExpoGlassView
          glassEffectStyle={glassEffectStyle}
          isInteractive={isInteractive}
          tintColor={tintColor}
          style={[
            {
              borderRadius,
            },
            containerStyle as any,
          ]}
        >
          {children}
        </ExpoGlassView>
      )
    }

    // android fallback - just use simple View (blur doesn't work on android)
    if (isAndroid) {
      return (
        <View bg="$color4" style={[{ borderRadius, overflow: 'hidden' }, containerStyle]}>
          {children}
        </View>
      )
    }

    // fallback to expo-blur for older iOS versions
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          {
            overflow: 'hidden',
            borderRadius,
            // subtle outer shadow for depth
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

        {/* glass overlay layer with gradient-like effect */}
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
  }
)
