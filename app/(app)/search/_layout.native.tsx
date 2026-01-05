import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { router, Stack } from 'one'

import { Pressable } from '~/interface/buttons/Pressable'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'

export function SearchLayout() {
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
          title: 'Search',
          headerLargeTitle: true,
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
        }}
      />
    </Stack>
  )
}
