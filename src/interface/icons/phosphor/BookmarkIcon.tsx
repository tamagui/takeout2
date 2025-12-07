import Svg, { Path } from 'react-native-svg'

import { useIconProps } from '~/interface/icons/useIconProps'

import type { IconProps } from '~/interface/icons/types'

export const BookmarkIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M184,28H72A20,20,0,0,0,52,48V224a12,12,0,0,0,19.32,9.51L128,188l56.68,45.49A12,12,0,0,0,204,224V48A20,20,0,0,0,184,28Zm-4,179.22-44.68-35.84a12,12,0,0,0-14.64,0L76,207.22V52H180Z"
        fill={fill}
      />
    </Svg>
  )
}
