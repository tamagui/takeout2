import { router, Stack } from 'one'

import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'
import { HeaderButton } from '~/interface/buttons/HeaderButton'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'

export const ProfileLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
      }}
    >
      <Stack.Screen name="index">
        <Stack.Header>
          <Stack.Header.Title>Profile</Stack.Header.Title>
          <Stack.Header.Right asChild>
            <HeaderButton
              icon={<GearIcon size={24} />}
              onPress={() => router.push('/home/settings')}
            />
          </Stack.Header.Right>
        </Stack.Header>
      </Stack.Screen>
      <Stack.Screen name="post/[feedId]">
        <Stack.Header>
          <Stack.Header.Title>Post</Stack.Header.Title>
          <Stack.Header.Left asChild>
            <HeaderBackButton />
          </Stack.Header.Left>
        </Stack.Header>
      </Stack.Screen>
    </Stack>
  )
}
