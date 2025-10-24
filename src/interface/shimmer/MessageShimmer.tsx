import { XStack, YStack } from 'tamagui'
import { CircleShimmer } from './CircleShimmer'
import { LineShimmer } from './LineShimmer'

export const MessageShimmer = ({
  taller,
  average,
}: {
  taller?: boolean
  average?: boolean
}) => {
  return (
    <XStack maxW="100%" gap="$4">
      <CircleShimmer size={42} />
      <YStack flex={1} gap="$2">
        <LineShimmer width={100} height={24} />
        {average && <LineShimmer width={200} height={20} />}
        {taller && <LineShimmer width={450} height={18} />}
        <LineShimmer width={190} height={20} />
      </YStack>
    </XStack>
  )
}
