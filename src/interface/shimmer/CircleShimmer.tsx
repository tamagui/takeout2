import { Circle, type CircleProps, type ViewStyle } from 'tamagui'

import { Shimmer } from './Shimmer'

export interface CircleShimmerNativeProps {
  size?: number
  style?: ViewStyle
}

export const CircleShimmer = (props: CircleProps) => {
  return (
    <Circle overflow="hidden" {...props}>
      <Shimmer />
    </Circle>
  )
}
