import { View, XStack, YStack } from 'tamagui'

import { CircleShimmer } from './CircleShimmer'
import { LineShimmer } from './LineShimmer'
import { Shimmer } from './Shimmer'
import { ShimmerProvider } from './ShimmerContext'

export const ChatShimmer = () => {
  return (
    <ShimmerProvider duration={1500}>
      <YStack justify="flex-end" pb="6" bg="background" h="100%" w="100%" gap={16}>
        <MessageShimmer />
        <ShortMessageShimmer />
        <LongMessageShimmer />
        <MessageShimmer />
        <ShortMessageShimmer />
        <LongMessageShimmer />
      </YStack>
    </ShimmerProvider>
  )
}

const MessageShimmer = () => {
  return (
    <XStack items="center" justify="space-between" gap={12}>
      <CircleShimmer size={33} />
      <YStack flex={1} gap="2">
        <LineShimmer w={120} h={18} />
        <LineShimmer w={80} h={14} />
      </YStack>
    </XStack>
  )
}

const ShortMessageShimmer = () => {
  return (
    <XStack items="center" justify="space-between" gap={12}>
      <CircleShimmer size={33} />
      <YStack flex={1} gap="2">
        <LineShimmer w={180} h={14} />
        <LineShimmer w={120} h={14} />
      </YStack>
    </XStack>
  )
}

const LongMessageShimmer = () => {
  return (
    <XStack items="center" justify="space-between" gap={12}>
      <CircleShimmer size={33} />
      <YStack flex={1} gap="2">
        <LineShimmer w={180} h={14} />
        <LineShimmer w={120} h={14} />
        <LineShimmer w={80} h={14} />
      </YStack>
    </XStack>
  )
}

export const HomeShimmer = () => {
  return (
    <ShimmerProvider duration={1500}>
      <FeedCardsShimmer />
    </ShimmerProvider>
  )
}

const FeedCardsShimmer = () => {
  return (
    <YStack gap="4" p="4">
      {Array.from({ length: 2 }).map((_, index) => (
        <CardShimmer key={index} />
      ))}
    </YStack>
  )
}

const CardAvatarShimmer = () => {
  return (
    <XStack items="center" justify="space-between" gap={12}>
      <CircleShimmer size={33} />
      <YStack flex={1} gap={4}>
        <LineShimmer w={120} h={18} />
        <LineShimmer w={80} h={14} />
      </YStack>
    </XStack>
  )
}

const CardShimmer = () => {
  return (
    <YStack rounded="6" gap="4" justify="center" items="center">
      <View gap="4" w="100%" maxW={500}>
        <CardAvatarShimmer />
        <View h={250} rounded="6" overflow="hidden">
          <Shimmer />
        </View>
      </View>
      <XStack gap="4">
        <LineShimmer w={60} h={24} />
        <LineShimmer w={60} h={24} />
        <LineShimmer w={60} h={24} />
      </XStack>
    </YStack>
  )
}
