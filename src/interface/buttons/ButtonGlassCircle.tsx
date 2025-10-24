import { CornerStyle, ExpoLiquidGlassView, LiquidGlassType } from 'expo-liquid-glass-view'
import { TouchableOpacity } from 'react-native'
import { View } from 'tamagui'
import { isIos } from '@vxrn/helpers'
import type { ReactNode } from 'react'
import { GlassView } from '../view/GlassView'

interface ButtonGlassCircleProps {
  onPress?: () => void
  size?: number
  children: ReactNode
  borderRadius?: number
}

export function ButtonGlassCircle({
  onPress,
  size = 40,
  borderRadius = 16,
  children,
}: ButtonGlassCircleProps) {
  const button = (
    <View items="center" justify="center" width={size} height={size}>
      {children}
    </View>
  )

  if (!isIos) {
    // android fallback with regular view
    return (
      <TouchableOpacity onPress={onPress}>
        <View
          width={size}
          height={size}
          items="center"
          justify="center"
          bg="$background"
          rounded="$10"
          borderWidth={0.5}
          borderColor="$borderColor"
        >
          {children}
        </View>
      </TouchableOpacity>
    )
  }

  const glassButton = (
    <GlassView
      borderRadius={borderRadius || size / 2}
      cornerStyle={CornerStyle.Circular}
      liquidGlassType={LiquidGlassType.Clear}
    >
      {button}
    </GlassView>
  )

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{glassButton}</TouchableOpacity>
  }

  return glassButton
}
