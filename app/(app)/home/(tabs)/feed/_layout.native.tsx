import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { Stack } from 'one'

import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'

export function HomeLayout() {
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
          headerShown: false,
        }}
      />
      <Stack.Screen name="profile/[userId]" />
      <Stack.Screen
        name="post/[feedId]"
        options={() => ({
          title: 'Post',
          headerLeft: () => <HeaderBackButton />,
        })}
      />
    </Stack>
  )
}
