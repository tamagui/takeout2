import { Stack } from 'one'

import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'

export const AILayout = () => {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="index">
        <Stack.Header>
          <Stack.Header.Title>Takeout Assistant</Stack.Header.Title>
          <Stack.Header.Left asChild>
            <HeaderBackButton />
          </Stack.Header.Left>
        </Stack.Header>
      </Stack.Screen>
    </Stack>
  )
}
