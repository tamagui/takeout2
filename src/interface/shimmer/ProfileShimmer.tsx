import { XStack, YStack } from 'tamagui'
import { CircleShimmer } from './CircleShimmer'
import { LineShimmer } from './LineShimmer'

interface ProfileShimmerProps {
  size?: number
  showBio?: boolean
}

export const ProfileShimmer = ({ size = 64, showBio = true }: ProfileShimmerProps) => {
  return (
    <XStack gap="$3" items="center" py="$3">
      <CircleShimmer size={size} />
      <YStack flex={1} gap="$2">
        <LineShimmer height={16} width="60%" />
        <LineShimmer height={14} width="40%" />
        {showBio && <LineShimmer height={12} width="80%" />}
      </YStack>
    </XStack>
  )
}
