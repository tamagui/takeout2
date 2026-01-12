import Svg, { Path } from 'react-native-svg'

import { useIconProps } from '~/interface/icons/useIconProps'

import type { IconProps } from '~/interface/icons/types'

export const TerminalIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M120,137,48,201a12,12,0,1,1-16-18l61.91-55L32,73A12,12,0,1,1,48,55l72,64a12,12,0,0,1,0,18ZM216,188H120a12,12,0,0,0,0,24h96a12,12,0,0,0,0-24Z"
        fill={fill}
      />
    </Svg>
  )
}
