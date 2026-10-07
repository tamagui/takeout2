import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { useIconProps } from '../useIconProps'
import type { IconProps } from '../types'

export const CaretDownIcon = memo((props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
        fill={fill}
      />
    </Svg>
  )
})
