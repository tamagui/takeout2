import { Slot, Stack } from 'one'
import { useMedia, View, YStack } from 'tamagui'

import { FeedContent } from '~/features/feed/FeedContent'
import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'

export function HomeLayout() {
  const { lg } = useMedia()

  if (process.env.VITE_NATIVE) {
    return (
      <Stack
        screenOptions={{
          headerTransparent: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="profile/[userId]">
          <Stack.Header>
            <Stack.Header.Title>Profile</Stack.Header.Title>
            <Stack.Header.Left asChild>
              <HeaderBackButton />
            </Stack.Header.Left>
          </Stack.Header>
        </Stack.Screen>
        <Stack.Screen name="post/[feedId]">
          <Stack.Header>
            <Stack.Header.Title>Post</Stack.Header.Title>
            <Stack.Header.Left asChild>
              <HeaderBackButton />
            </Stack.Header.Left>
          </Stack.Header>
        </Stack.Screen>
      </Stack>
    )
  }

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
