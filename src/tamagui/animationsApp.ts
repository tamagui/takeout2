import { createAnimations } from '@tamagui/animations-motion'
import { animationsMotion } from '@tamagui/config/animations-motion'

export const animationsApp = createAnimations({
  ...animationsMotion.animations,
  // ... your extra animations
})
