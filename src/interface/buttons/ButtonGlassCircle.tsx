import { isIos } from '@vxrn/helpers'
import type { ReactNode } from 'react'
import { TouchableOpacity } from 'react-native'
import { View } from 'tamagui'
import { GlassView } from '../effects/GlassView'
import { Pressable } from './Pressable'

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
  return (
    <GlassView
      borderRadius={borderRadius || size / 2}
      glassEffectStyle="clear"
      containerStyle={{ width: size, height: size }}
    >
      <Pressable
        width={size}
        height={size}
        items="center"
        justify="center"
        bg="$background"
        rounded="$10"
        borderWidth={0.5}
        borderColor="$borderColor"
        onPress={onPress}
      >
        {children}
      </Pressable>
    </GlassView>
  )
}
