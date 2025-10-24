import { YStack, type YStackProps } from 'tamagui'
import { Shimmer } from './Shimmer'

export const LineShimmer = (
  props: Omit<YStackProps, 'width' | 'height'> & {
    width: number
    height: number
  }
) => {
  return (
    <YStack rounded={15} maxW="100%" overflow="hidden" {...props}>
      <Shimmer />
    </YStack>
  )
}
