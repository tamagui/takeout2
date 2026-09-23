import type { TransitionProp } from 'tamagui'

// you almost never want opacity or background color to "bounce past" the ends
// when doing spring animations, so this is a nice helper

export const transitionMediumClamped: TransitionProp = [
  'medium',
  { opacity: '400ms', backgroundColor: '400ms' },
]

export const transitionQuickestClamped: TransitionProp = [
  'quickest',
  { opacity: '75ms', backgroundColor: '75ms' },
]

export const transitionQuickestLessBouncyClamped: TransitionProp = [
  'quickestLessBouncy',
  { opacity: '75ms', backgroundColor: '75ms' },
]

export const transitionQuickerLessBouncyClamped: TransitionProp = [
  'quickerLessBouncy',
  { opacity: '200ms', backgroundColor: '200ms' },
]
