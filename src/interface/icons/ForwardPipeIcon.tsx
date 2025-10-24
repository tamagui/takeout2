import { memo } from 'react'
import Svg, { Path } from 'react-native-svg'
import type { IconProps } from '~/interface/icons/types'
import { useIconProps } from '~/interface/icons/useIconProps'

export const ForwardPipeIcon = memo((props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...svgProps}>
      <Path
        d="M2 8h14M2 16h14"
        stroke={fill || 'currentColor'}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M12 4l8 8-8 8V4z"
        stroke={fill || 'currentColor'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
})
