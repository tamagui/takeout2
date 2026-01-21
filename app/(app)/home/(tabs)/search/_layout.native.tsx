import { Stack } from 'one'

import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'

export const SearchLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="index">
        <Stack.Header>
          <Stack.Header.Title>Search</Stack.Header.Title>
          <Stack.Header.Left asChild>
            <HeaderBackButton />
          </Stack.Header.Left>
        </Stack.Header>
      </Stack.Screen>
    </Stack>
  )
}
