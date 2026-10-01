import { useIconProps } from 'contrast-ui/icons/useIconProps'
import { memo } from 'react'
import { Svg, Path } from 'react-native-svg'
import type { IconProps } from 'contrast-ui/icons/types'

export const ShoppingBag = memo((props: IconProps) => {
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
      <Path d="M16 10a4 4 0 0 1-8 0" />
      <Path d="M3.103 6.034h17.794" />
      <Path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
    </Svg>
  )
})
