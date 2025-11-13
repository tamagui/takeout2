import Svg, { Path } from 'react-native-svg'
import { useIconProps } from '~/interface/icons/useIconProps'
import type { IconProps } from '~/interface/icons/types'

export const FileVideoIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40v72a8,8,0,0,0,16,0V40h88V88a8,8,0,0,0,8,8h48V216h-8a8,8,0,0,0,0,16h8a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM155.88,145a8,8,0,0,0-8.12.22l-19.95,12.46A16,16,0,0,0,112,144H48a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h64a16,16,0,0,0,15.81-13.68l19.95,12.46A8,8,0,0,0,160,216V152A8,8,0,0,0,155.88,145ZM112,208H48V160h64v48Zm32-6.43-16-10V176.43l16-10Z"
        fill={fill}
      />
    </Svg>
  )
}
