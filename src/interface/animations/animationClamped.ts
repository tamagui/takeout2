import type { TransitionKeys, TransitionProp } from 'tamagui'

// you almost never want opacity or background color to "bounce past" the ends
// when doing spring animations, so this is a nice helper

const springToTime: Partial<Record<TransitionKeys, TransitionKeys>> = {
  quickLessBouncy: '300ms',
  quick: '200ms',
  quicker: '100ms',
  quickerLessBouncy: '200ms',
  quickest: '75ms',
  quickestLessBouncy: '75ms',
}

export const animationClamped = (
  animation: TransitionKeys,
  opacitySpeed: TransitionKeys = springToTime[animation] || '75ms'
): TransitionProp => {
  return [
    animation,
    {
      opacity: opacitySpeed,
      backgroundColor: opacitySpeed,
    },
  ]
}
