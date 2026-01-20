import { createAnimations } from '@tamagui/animations-reanimated'
import { animations } from '@tamagui/config/v5-reanimated'

export const animationsApp = createAnimations({
  ...animations.animations,
  smoothExpand: {
    type: 'timing',
    duration: 250,
  },
})
