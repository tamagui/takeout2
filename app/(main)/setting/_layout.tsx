import { ChevronLeft } from '@tamagui/lucide-icons'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { router, Slot, Stack } from 'one'
import { isWeb } from 'tamagui'
import { Pressable } from '~/interface/buttons/Pressable'

export function UserLayout() {
  if (isWeb) {
    return <Slot />
  }

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
          headerLargeTitle: true,
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
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
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
      <Stack.Screen
        name="blocked-users"
        options={{
          title: 'Blocked Users',
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
