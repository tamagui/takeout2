import { createAnimations } from '@tamagui/animations-motion'
import { animationsMotion } from '@tamagui/config/v5-motion'

export const animationsApp = createAnimations({
  ...animationsMotion.animations,
  '200ms': {
    duration: 200,
  },
  '250ms': {
    duration: 250,
  },
})
