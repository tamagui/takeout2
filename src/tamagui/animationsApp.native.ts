import { createAnimations } from '@tamagui/animations-reanimated'
import { animationsReanimated } from '@tamagui/config/v5-reanimated'

export const animationsApp = createAnimations({
  ...animationsReanimated.animations,
  '250ms': {
    type: 'timing',
    duration: 250,
  },
})
