import { memo } from 'react'
import { G, Path, Rect, Svg } from 'react-native-svg'

import type { IconProps } from '../types'

export const TamaguiLogo = memo(({ size = 24, ...svgProps }: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...svgProps}>
      <G stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <Rect fill="#000000" x="11" y="4" width="14" height="8" />
        <Path
          d="M2,22 L2,20 L4,20 L4,18 L6,18 L6,16 L8,16 L8,6 L10,6 L10,2 L14,2 L14,0 L24,0 L24,2 L26,2 L26,4 L28,4 L28,8 L32,8 L32,10 L30,10 L30,12 L32,12 L32,14 L30,14 L30,16 L28,16 L28,20 L30,20 L30,22 L32,22 L32,28 L30,28 L30,30 L26,30 L26,32 L8,32 L8,30 L4,30 L4,28 L2,28 L2,26 L0,26 L0,22 L2,22 Z M18,8 L16,8 L16,10 L18,10 L18,8 Z M24,6 L22,6 L22,8 L24,8 L24,6 Z"
          fill="#ECD20A"
        />
      </G>
    </Svg>
  )
})
