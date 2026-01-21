import { Stack } from 'one'

import { HeaderBackButton } from '~/interface/buttons/HeaderButton'

export function HomeLayout() {
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
