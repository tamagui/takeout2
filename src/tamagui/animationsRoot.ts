import { createAnimations } from '@tamagui/animations-css/extras'
import { animationsCSS } from '@tamagui/config/v5-css'

export const animationsRoot = createAnimations({
  ...animationsCSS.animations,
  // ... your extra animations
})
