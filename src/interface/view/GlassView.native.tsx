import { BlurView } from 'expo-blur'
import * as Device from 'expo-device'
import { ExpoLiquidGlassView, LiquidGlassType } from 'expo-liquid-glass-view'
import { memo } from 'react'
import { View } from 'tamagui'
import type { GlassViewProps } from './GlassView'

// hardcoded iOS 26 detection for now
const isIOS26 = Device.osVersion?.includes('26')

export const GlassView = memo(
  ({
    width = 100,
    height = 100,
    borderRadius = 16,
    intensity = 40,
    tint = 'regular',
    containerStyle,
    children,
    cornerStyle,
    liquidGlassType,
    style,
    isFallback,
    backgroundColor = 'rgba(255, 255, 255, 0.05)',
  }: GlassViewProps) => {
    // use expo-liquid-glass-view for iOS 26
    if (isIOS26 && !isFallback) {
      return (
        <ExpoLiquidGlassView
          type={liquidGlassType || LiquidGlassType.Clear}
          cornerStyle={cornerStyle}
          cornerRadius={borderRadius}
          style={containerStyle as any}
        >
          {children}
        </ExpoLiquidGlassView>
      )
    }

    // fallback to expo-blur for other versions
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
        {/* Glass overlay layer with gradient-like effect */}
        <View
          position="absolute"
          z={1}
          t={0}
          l={0}
          r={0}
          b={0}
          rounded={borderRadius}
          bg={backgroundColor as any}
        />

        {/* Subtle inner light edge - minimal and clean */}
        <View
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          z={2}
          pointerEvents="none"
          rounded={borderRadius}
          borderWidth={0.5}
          borderColor="rgba(255, 255, 255, 0.15)"
        />

        {/* Content container */}
        <View z={3} items="center" justify="center" style={style as any}>
          {children}
        </View>
      </BlurView>
    )
  }
)
