import { createAnimations } from '@tamagui/animations-reanimated'
import { animationsReanimated } from '@tamagui/config/v5-reanimated'

export const animationsRoot = createAnimations({
  ...animationsReanimated.animations,
  // ... your extra animations
})
