import { createAnimations } from '@tamagui/animations-css'
import { animations } from '@tamagui/config/v5-css'

export const animationsRoot = createAnimations({
  ...animations.animations,
  smoothExpand: '250ms ease-out',
})
