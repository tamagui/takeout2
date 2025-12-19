import type { BlurViewProps } from 'expo-blur'
import type { ViewProps } from 'tamagui'

export interface GlassViewProps {
  borderRadius?: number
  intensity?: number
  tint?: BlurViewProps['tint']
  containerStyle?: ViewProps['style']
  children?: React.ReactNode
  glassEffectStyle?: 'clear' | 'regular'
  style?: ViewProps['style']
  isFallback?: boolean
  backgroundColor?: string
  tintColor?: string
  isInteractive?: boolean
}
