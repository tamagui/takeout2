import { createAnimations } from '@tamagui/animations-motion'
import { animations } from '@tamagui/config/v5-motion'

export const animationsApp = createAnimations({
  ...animations.animations,
  '200ms': {
    duration: 200,
  },
  '250ms': {
    duration: 250,
  },
})
