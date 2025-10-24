import { createAnimations } from '@tamagui/animations-css'

const smoothBezier = 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'

export const animationsCSS = createAnimations({
  '0ms': 'ease-in-out 0ms',
  '75ms': 'ease-in-out 75ms',
  '100ms': 'ease-in-out 100ms',
  '200ms': 'ease-in-out 200ms',
  bouncy: `${smoothBezier} 300ms`,
  superBouncy: `${smoothBezier} 400ms`,
  lazy: `${smoothBezier} 2500ms`,
  superLazy: 'ease-in-out 1500ms',
  medium: 'ease-in-out 700ms',
  slow: 'ease-in-out 900ms',
  quick: `${smoothBezier} 200ms`,
  quickLessBouncy: `ease-in-out 200ms`,
  quicker: `${smoothBezier} 150ms`,
  quickerLessBouncy: `ease-in-out 150ms`,
  quickest: `${smoothBezier} 60ms`,
  quickestLessBouncy: `linear 35ms`,
  tooltip: 'ease-in-out 400ms',
})
