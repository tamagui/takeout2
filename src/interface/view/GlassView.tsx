import { BlurView, type BlurViewProps } from 'expo-blur'
import * as Device from 'expo-device'
import { GlassView as ExpoGlassView } from 'expo-glass-effect'
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
  glassEffectStyle?: 'clear' | 'regular'
  style?: ViewStyle
  isFallback?: boolean
  backgroundColor?: string
  tintColor?: string
  isInteractive?: boolean
}

// ios 26+ supports native glass effect
const isIOS26Plus = Device.osVersion
  ? Number.parseInt(Device.osVersion.split('.')[0] ?? '0', 10) >= 26
  : false

export const GlassView = memo(
  ({
    width = 100,
    height = 100,
    borderRadius = 16,
    intensity = 40,
    tint = 'regular',
    containerStyle,
    children,
    glassEffectStyle = 'clear',
    style,
    isFallback,
    backgroundColor = 'rgba(255, 255, 255, 0.05)',
    tintColor,
    isInteractive = false,
  }: GlassViewProps) => {
    // use expo-glass-effect for iOS 26+
    if (isIOS26Plus && !isFallback) {
      return (
        <ExpoGlassView
          glassEffectStyle={glassEffectStyle}
          isInteractive={isInteractive}
          tintColor={tintColor}
          style={[
            {
              borderRadius,
              overflow: 'hidden',
            },
            containerStyle as any,
          ]}
        >
          {children}
        </ExpoGlassView>
      )
    }

    // fallback to expo-blur for older iOS versions and other platforms
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
        />

        {/* subtle inner light edge - minimal and clean */}
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

        {/* content container */}
        <View z={3} items="center" justify="center" style={style as any}>
          {children}
        </View>
      </BlurView>
    )
  }
)
