import { Circle, type CircleProps } from 'tamagui'

import { Shimmer } from './Shimmer'

export const CircleShimmer = (props: CircleProps) => {
  return (
    <Circle overflow="hidden" {...props}>
      <Shimmer />
    </Circle>
  )
}
