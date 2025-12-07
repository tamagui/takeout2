import { YStack, type YStackProps } from 'tamagui'

import { Shimmer } from './Shimmer'

export const LineShimmer = (props: YStackProps) => {
  return (
    <YStack rounded={15} maxW="100%" overflow="hidden" {...props}>
      <Shimmer />
    </YStack>
  )
}
