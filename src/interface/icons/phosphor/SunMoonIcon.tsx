import Svg, { Path } from 'react-native-svg'
import { useIconProps } from '~/interface/icons/useIconProps'
import type { IconProps } from '~/interface/icons/types'

export const SunMoonIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M120,40V32a8,8,0,0,1,16,0v8a8,8,0,0,1-16,0Zm72,88a64.07,64.07,0,0,1-64,64,8,8,0,0,1,0-16,48,48,0,1,0,0-96,8,8,0,0,1,0-16A64.07,64.07,0,0,1,192,128Zm-58.34-58.34A8,8,0,0,0,144.97,58.34l-16-16A8,8,0,0,0,117.66,53.66Zm-75.32,0,16,16a8,8,0,0,0,11.32-11.32l-16-16A8,8,0,0,0,58.34,69.66ZM48,128a8,8,0,0,0-8-8H32a8,8,0,0,0,0,16h8A8,8,0,0,0,48,128Zm16,48a72.85,72.85,0,0,1,14.4-43.2,8,8,0,1,1,12.8,9.6A56.78,56.78,0,0,0,80,176a56,56,0,0,0,112,0,8,8,0,0,1,16,0A72,72,0,0,1,64,176Z"
        fill={fill}
      />
    </Svg>
  )
}
