import { View, XStack, YStack } from 'tamagui'

import { CircleShimmer } from './CircleShimmer'
import { LineShimmer } from './LineShimmer'
import { Shimmer } from './Shimmer'
import { ShimmerProvider } from './ShimmerContext'

export const ChatShimmer = () => {
  return (
    <ShimmerProvider duration={1500}>
      <YStack
        justify="flex-end"
        pb="$6"
        bg="$background"
        height="100%"
        width="100%"
        gap={16}
      >
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
      <YStack flex={1} gap={8}>
        <LineShimmer width={120} height={18} />
        <LineShimmer width={80} height={14} />
      </YStack>
    </XStack>
  )
}

const ShortMessageShimmer = () => {
  return (
    <XStack items="center" justify="space-between" gap={12}>
      <CircleShimmer size={33} />
      <YStack flex={1} gap={8}>
        <LineShimmer width={180} height={14} />
        <LineShimmer width={120} height={14} />
      </YStack>
    </XStack>
  )
}

const LongMessageShimmer = () => {
  return (
    <XStack items="center" justify="space-between" gap={12}>
      <CircleShimmer size={33} />
      <YStack flex={1} gap={8}>
        <LineShimmer width={180} height={14} />
        <LineShimmer width={120} height={14} />
        <LineShimmer width={80} height={14} />
      </YStack>
    </XStack>
  )
}

export const HomeShimmer = () => {
  return (
    <ShimmerProvider duration={1500}>
      <YStack bg="$background" height="100%" width="100%">
        {/* feed cards shimmer */}
        <FeedCardsShimmer />
      </YStack>
    </ShimmerProvider>
  )
}

const FeedCardsShimmer = () => {
  return (
    <YStack gap={12} p={16}>
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
        <LineShimmer width={120} height={18} />
        <LineShimmer width={80} height={14} />
      </YStack>
    </XStack>
  )
}

const CardShimmer = () => {
  return (
    <YStack rounded={16} gap={12}>
      {/* card header with avatar and name */}
      <CardAvatarShimmer />

      {/* card image placeholder */}
      <View bg="$color02" height={300} rounded={12} overflow="hidden">
        <Shimmer />
      </View>

      {/* card actions */}
      <XStack gap={16} pt={4}>
        <LineShimmer width={60} height={24} />
        <LineShimmer width={60} height={24} />
        <LineShimmer width={60} height={24} />
      </XStack>
    </YStack>
  )
}
