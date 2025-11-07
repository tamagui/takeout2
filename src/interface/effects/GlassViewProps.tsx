import type { BlurViewProps } from 'expo-blur'
import type { ViewStyle } from 'tamagui'

export interface GlassViewProps {
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
