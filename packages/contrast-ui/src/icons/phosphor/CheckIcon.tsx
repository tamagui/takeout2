import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { useIconProps } from '../useIconProps'
import type { IconProps } from '../types'

export const CheckIcon = memo((props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"
        fill={fill}
      />
    </Svg>
  )
})
