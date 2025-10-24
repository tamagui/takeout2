import { View, type ViewStyle } from 'tamagui'
import { Shimmer } from './Shimmer.native'
import type { CircleShimmerNativeProps } from './CircleShimmer'

export const CircleShimmer = ({ size = 36, style }: CircleShimmerNativeProps) => {
  const circleStyle: ViewStyle = {
    width: size,
    height: size,
    rounded: size / 2,
    bg: '$color02',
    overflow: 'hidden',
    ...style,
  }

  return (
    <View {...circleStyle}>
      <Shimmer />
    </View>
  )
}
