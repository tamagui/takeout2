// native uses the reanimated driver so tamagui Sheet drag-tracking, spring
// transitions, and enter: and exit: clauses actually animate in the simulator
// and on device. we are all-in on reanimated; do not swap to
// @tamagui/config/animations-rn (the RN Animated driver).
import { createAnimations } from '@tamagui/animations-reanimated'
import { animationsReanimated } from '@tamagui/config/animations-reanimated'

export const animationsRoot = createAnimations({
  ...animationsReanimated.animations,
})
