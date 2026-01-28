import type { ViewProps } from 'tamagui'
import type { BlurTint } from '~/interface/effects/BlurView'

export interface GlassViewProps {
  borderRadius?: number
  intensity?: number
  tint?: BlurTint
  containerStyle?: ViewProps['style']
  children?: React.ReactNode
  glassEffectStyle?: 'clear' | 'regular'
  style?: ViewProps['style']
  isFallback?: boolean
  backgroundColor?: string
  tintColor?: string
  isInteractive?: boolean
}
