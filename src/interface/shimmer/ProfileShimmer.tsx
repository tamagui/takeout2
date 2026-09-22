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
      <YStack bg="background" h="100%" w="100%" px={14} pt={60}>
        <XStack gap="3" items="center" py="3">
          <CircleShimmer size={size} />
          <YStack flex={1} gap="2">
            <LineShimmer h={16} w="30%" />
            <LineShimmer h={14} w="20%" />
            <LineShimmer h={12} w="80%" />
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
        <View key={index} w="50%" aspectRatio={1} p={4}>
          <View w="100%" h="100%" bg="color1" rounded={8} overflow="hidden">
            <Shimmer />
          </View>
        </View>
      ))}
    </XStack>
  )
}
