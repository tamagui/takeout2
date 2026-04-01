// de-opt to react-native for now, fixing issue with worklets
import { createAnimations } from '@tamagui/animations-react-native'
import { animationsReanimated } from '@tamagui/config/v5-reanimated'

export const animationsApp = createAnimations({
  ...animationsReanimated.animations,
  // ... your extra animations
})
