import { Slot, Stack } from 'one'

import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'

export function HomeLayout() {

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

  // on web, just use Slot for standard page transitions
  return <Slot />
}
