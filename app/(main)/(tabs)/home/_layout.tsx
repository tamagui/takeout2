import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { Stack } from 'one'

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Feed',
          headerBlurEffect: isLiquidGlassAvailable() ? undefined : 'regular',
          headerTransparent: true,
          headerLargeStyle: { backgroundColor: 'transparent' },
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen name="profile/[userId]" />
      <Stack.Screen name="post/[feedId]" />
    </Stack>
  )
}
