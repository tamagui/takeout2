import type { BlurViewProps } from 'expo-blur'
import type { CornerStyle, LiquidGlassType } from 'expo-liquid-glass-view'
import { memo } from 'react'
import { View, type ViewStyle } from 'tamagui'

export interface GlassViewProps {
  width?: number
  height?: number
  borderRadius?: number
  intensity?: number
  tint?: BlurViewProps['tint']
  containerStyle?: ViewStyle
  children?: React.ReactNode
  cornerStyle?: CornerStyle
  liquidGlassType?: LiquidGlassType
  style?: ViewStyle
  isFallback?: boolean
  backgroundColor?: string
}

export const GlassView = memo(
  ({
    width = 100,
    height = 100,
    borderRadius = 16,
    intensity = 40,
    tint = 'dark',
    containerStyle,
    children,
  }: GlassViewProps) => {
    const blurAmount = (intensity / 100) * 20 // Convert intensity to blur px
    const tintColor =
      tint === 'dark'
        ? 'rgba(0, 0, 0, 0.2)'
        : tint === 'light'
          ? 'rgba(255, 255, 255, 0.2)'
          : 'rgba(128, 128, 128, 0.1)'

    return (
      <View {...containerStyle}>
        <View
          width={width}
          height={height}
          rounded={borderRadius}
          overflow="hidden"
          position="relative"
          style={{
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
            backgroundColor: tintColor,
          }}
        >
          {/* Glass overlay layer */}
          <View
            position="absolute"
            t={0}
            l={0}
            r={0}
            b={0}
            bg="rgba(255, 255, 255, 0.1)"
            rounded={borderRadius}
            z={1}
          />

          {/* Inner shadow border effect */}
          <View
            position="absolute"
            t={0}
            l={0}
            r={0}
            b={0}
            rounded={borderRadius}
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.2)"
            z={2}
            pointerEvents="none"
            // @ts-expect-error - CSS properties for web
            style={{
              boxShadow: `
              inset 1px 1px 0.5px 0 rgba(255, 255, 255, 0.5),
              inset -1px -1px 0.5px 0.5px rgba(255, 255, 255, 0.5)
            `,
            }}
          />

          {/* Content container */}
          <View
            position="relative"
            width="100%"
            height="100%"
            display="flex"
            items="center"
            justify="center"
            z={3}
          >
            {children}
          </View>
        </View>
      </View>
    )
  }
)
