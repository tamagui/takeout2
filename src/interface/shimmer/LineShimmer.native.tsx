import { Shimmer } from './Shimmer.native'
import { View, type ViewStyle } from 'tamagui'

interface LineShimmerProps {
  width?: number
  height?: number
  style?: ViewStyle
}

export const LineShimmer = ({ width = 200, height = 20, style }: LineShimmerProps) => {
  const lineStyle: ViewStyle = {
    width: width,
    height: height,
    bg: '$color02',
    rounded: 10,
    overflow: 'hidden',
    ...style,
  }

  return (
    <View {...lineStyle}>
      <Shimmer />
    </View>
  )
}
