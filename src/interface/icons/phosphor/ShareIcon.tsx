import Svg, { Path } from 'react-native-svg'
import { useIconProps } from '~/interface/icons/useIconProps'
import type { IconProps } from '~/interface/icons/types'

export const ShareIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M232.49,112.49l-48,48a12,12,0,0,1-17-17L195,116H165a84,84,0,0,0-81.36,63,12,12,0,1,1-23.24-6A107.94,107.94,0,0,1,165,92H195L167.51,64.48a12,12,0,0,1,17-17l48,48A12,12,0,0,1,232.49,112.49ZM192,204H44V88a12,12,0,0,0-24,0V216a12,12,0,0,0,12,12H192a12,12,0,0,0,0-24Z"
        fill={fill}
      />
    </Svg>
  )
}
