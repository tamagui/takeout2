import { View, XStack, YStack } from 'tamagui'

import { CircleShimmer } from './CircleShimmer'
import { LineShimmer } from './LineShimmer'
import { Shimmer } from './Shimmer'
import { ShimmerProvider } from './ShimmerContext'

interface ProfileShimmerProps {
  size?: number
}

export const ProfileShimmer = ({ size = 64 }: ProfileShimmerProps) => {
  return (
    <ShimmerProvider duration={1500}>
      <YStack bg="$background" height="100%" width="100%" px={14} pt={60}>
        <XStack gap="$3" items="center" py="$3">
          <CircleShimmer size={size} />
          <YStack flex={1} gap="$2">
            <LineShimmer height={16} width="30%" />
            <LineShimmer height={14} width="20%" />
            <LineShimmer height={12} width="80%" />
          </YStack>
        </XStack>
        <ContentGridShimmer />
      </YStack>
    </ShimmerProvider>
  )
}

const ContentGridShimmer = () => {
  return (
    <XStack flexWrap="wrap" p={2}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} width="50%" aspectRatio={1} p={4}>
          <View width="100%" height="100%" bg="$color02" rounded={8} overflow="hidden">
            <Shimmer />
          </View>
        </View>
      ))}
    </XStack>
  )
}
