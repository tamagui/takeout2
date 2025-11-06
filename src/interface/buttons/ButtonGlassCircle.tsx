import type { ReactNode } from 'react'
import { View } from 'tamagui'
// import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import { GlassView } from '../effects/GlassView'

interface ButtonGlassCircleProps {
  onPress?: () => void
  size?: number
  children: ReactNode
  borderRadius?: number
}

export function ButtonGlassCircle({
  onPress,
  size = 40,
  borderRadius = 100,
  children,
}: ButtonGlassCircleProps) {
  return (
    <GlassView
      containerStyle={{
        width: size,
        height: size,
      }}
      borderRadius={borderRadius}
      glassEffectStyle="clear"
    >
      <View
        width={size}
        height={size}
        items="center"
        justify="center"
        rounded={borderRadius}
        onPress={onPress}
      >
        {children}
      </View>
    </GlassView>
  )
}
