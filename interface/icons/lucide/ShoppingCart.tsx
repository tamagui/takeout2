import { useIconProps } from 'takeout-ui/icons/useIconProps'
import { memo } from 'react'
import { Svg, Circle, Path } from 'react-native-svg'
import type { IconProps } from 'takeout-ui/icons/types'

export const ShoppingCart = memo((props: IconProps) => {
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
      <Path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18" />
      <Path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25" />
      <Circle cx="18" cy="20" r="2" />
      <Circle cx="8" cy="20" r="2" />
    </Svg>
  )
})
