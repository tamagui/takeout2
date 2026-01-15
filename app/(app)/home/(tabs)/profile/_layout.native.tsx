import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { router, Stack } from 'one'

import { Pressable } from '~/interface/buttons/Pressable'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'

export const ProfileLayout = () => {
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
          title: 'Profile',
          headerLargeTitle: true,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/home/settings')}
              width={36}
              height={36}
              items="center"
              justify="center"
            >
              <GearIcon size={24} color="$color12" />
            </Pressable>
          ),
        }}
      />
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
