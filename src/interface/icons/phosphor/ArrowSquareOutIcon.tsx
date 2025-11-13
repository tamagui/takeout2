import Svg, { Path } from 'react-native-svg'
import { useIconProps } from '~/interface/icons/useIconProps'
import type { IconProps } from '~/interface/icons/types'

export const ArrowSquareOutIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M224,104a8,8,0,0,1-16,0V59.32l-66.33,66.34a8,8,0,0,1-11.32-11.32L196.68,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"
        fill={fill}
      />
    </Svg>
  )
}
