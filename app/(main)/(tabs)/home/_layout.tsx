import { Bell, ChevronLeft } from '@tamagui/lucide-icons'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { router, Stack } from 'one'
import { Pressable } from '~/interface/buttons/Pressable'

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
        options={{
          title: 'Detail',
          headerBlurEffect: isLiquidGlassAvailable() ? undefined : 'regular',
          headerTransparent: true,
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
        }}
      />
    </Stack>
  )
}
