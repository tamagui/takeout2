import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { Stack } from 'one'

import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'

export function SettingLayout() {
  return (
    <Stack
      screenOptions={{
        headerBlurEffect: isLiquidGlassAvailable() ? undefined : 'regular',
        headerTransparent: true,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="blocked-users"
        options={{
          title: 'Blocked Users',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  )
}
