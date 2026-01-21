import { Stack } from 'one'

import { HeaderBackButton } from '~/interface/buttons/HeaderButton'

export function SettingLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
      }}
    >
      <Stack.Screen name="index">
        <Stack.Header>
          <Stack.Header.Title>Settings</Stack.Header.Title>
          <Stack.Header.Left asChild>
            <HeaderBackButton />
          </Stack.Header.Left>
        </Stack.Header>
      </Stack.Screen>
      <Stack.Screen name="edit-profile">
        <Stack.Header>
          <Stack.Header.Title>Edit Profile</Stack.Header.Title>
          <Stack.Header.Left asChild>
            <HeaderBackButton />
          </Stack.Header.Left>
        </Stack.Header>
      </Stack.Screen>
      <Stack.Screen name="blocked-users">
        <Stack.Header>
          <Stack.Header.Title>Blocked Users</Stack.Header.Title>
          <Stack.Header.Left asChild>
            <HeaderBackButton />
          </Stack.Header.Left>
        </Stack.Header>
      </Stack.Screen>
    </Stack>
  )
}
