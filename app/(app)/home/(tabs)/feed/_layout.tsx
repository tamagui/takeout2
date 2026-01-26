import { Slot } from 'one'
import { useMedia, View, YStack } from 'tamagui'

import { FeedContent } from '~/features/feed/FeedContent'

export function HomeLayout() {
  const { lg } = useMedia()
  if (!lg) {
    return <Slot />
  }

  return (
    <YStack flex={1}>
      <FeedContent />

      {/* modal renders here as overlay */}
      <View position="absolute" t={0} l={0} r={0} b={0} pointerEvents="box-none">
        <Slot />
      </View>
    </YStack>
  )
}
