import type { BlurTint } from './BlurView'
import type { ViewProps } from 'tamagui'

export interface GradientBlurViewProps extends ViewProps {
  intensity?: number
  tint?: BlurTint
  inverted?: boolean
}
