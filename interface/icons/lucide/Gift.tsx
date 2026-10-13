import { useIconProps } from 'takeout-ui/icons/useIconProps'
import { memo } from 'react'
import { Svg, Path, Rect } from 'react-native-svg'
import type { IconProps } from 'takeout-ui/icons/types'

export const Gift = memo((props: IconProps) => {
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
      <Path d="M12 7v14" />
      <Path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
      <Path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" />
      <Rect x="3" y="7" width="18" height="4" rx="1" />
    </Svg>
  )
})
