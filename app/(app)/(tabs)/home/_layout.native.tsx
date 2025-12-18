import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { router, Stack } from 'one'

import { Pressable } from '~/interface/buttons/Pressable'
import { BellIcon } from '~/interface/icons/phosphor/BellIcon'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'

import type { RouteProp } from '@react-navigation/native'

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
              <BellIcon size={24} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="profile/[userId]" />
      <Stack.Screen
        name="post/[feedId]"
        options={() => ({
          title: 'Post',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              width={36}
              height={36}
              items="center"
              justify="center"
            >
              <CaretLeftIcon size={24} />
            </Pressable>
          ),
        })}
      />
    </Stack>
  )
}
