import { Bell, ChevronLeft } from '@tamagui/lucide-icons'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { router, Stack } from 'one'
import { Pressable } from '~/interface/buttons/Pressable'

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
          title: 'Feed',
          headerLargeTitle: true,
          headerRight: () => (
            <Pressable width={36} height={36} items="center" justify="center">
              <Bell size={24} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="profile/[userId]" />
      <Stack.Screen
        name="post/[feedId]"
        options={({ route }: { route: any }) => ({
          title: route.params.username,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              width={36}
              height={36}
              items="center"
              justify="center"
            >
              <ChevronLeft size={24} />
            </Pressable>
          ),

          presentation: 'modal',
        })}
      />
    </Stack>
  )
}
