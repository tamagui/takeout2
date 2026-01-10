import { memo } from 'react'
import { G, Path, Svg } from 'react-native-svg'

import type { IconProps } from '../types'

export const TamaguiDotLogo = memo(({ size = 24, color, ...svgProps }: IconProps) => {
  const fillColor = (color as string) || '#000'
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill={fillColor}
      {...svgProps}
    >
      <Path d="M560 970h53v53h-53v-53zM485 970h53v53h-53v-53zM336 970h53v53h-53v-53zM261 970h53v53h-53v-53zM635 895h53v53h-53v-53zM485 895h53v53h-53v-53zM410 895h53v53h-53v-53zM186 895h53v53h-53v-53zM635 820h53v53h-53v-53zM111 820h53v53h-53v-53zM710 746h53v53h-53v-53zM36 746h53v53H36v-53zM785 671h53v53h-53v-53zM336 671h53v53h-53v-53zM785 597h53v53h-53v-53zM410 597h53v53h-53v-53zM261 597h53v53h-53v-53zM785 522h53v53h-53v-53zM410 522h53v53h-53v-53zM261 522h53v53h-53v-53zM934 447h53v53h-53v-53zM36 447h53v53H36v-53zM36 373h53v53H36v-53zM934 298h53v53h-53v-53zM785 298h53v53h-53v-53zM36 298h53v53H36v-53zM410 223h53v53h-53v-53zM36 223h53v53H36v-53zM934 149h53v53h-53v-53zM785 149h53v53h-53v-53zM635 149h53v53h-53v-53zM111 149h53v53h-53v-53zM710 74h53v53h-53V74zM186 74h53v53h-53V74zM860 447h52v53h-52v-53zM860 298h52v53h-52v-53zM860 149h52v53h-52v-53zM635 0h53v52h-53V0zM560 0h53v52h-53V0zM485 0h53v52h-53V0zM410 0h53v52h-53V0zM336 0h53v52h-53V0zM261 0h53v52h-53V0zM1009 373h15v53h-15v-53zM1009 298h15v53h-15v-53zM1009 223h15v53h-15v-53zM0 671h14v53H0v-53zM0 597h14v53H0v-53zM0 522h14v53H0v-53z" />
    </Svg>
  )
})
