import { useIconProps } from 'contrast-ui/icons/useIconProps'
import { memo } from 'react'
import { Svg, Path, Rect } from 'react-native-svg'
import type { IconProps } from 'contrast-ui/icons/types'

export const Film = memo((props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svgProps}
    >
      <Rect width="18" height="18" x="3" y="3" rx="2" />
      <Path d="M7 3v18" />
      <Path d="M3 7.5h4" />
      <Path d="M3 12h18" />
      <Path d="M3 16.5h4" />
      <Path d="M17 3v18" />
      <Path d="M17 7.5h4" />
      <Path d="M17 16.5h4" />
    </Svg>
  )
})
