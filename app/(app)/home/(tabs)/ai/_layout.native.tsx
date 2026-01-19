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
      <Stack.Screen
        name="index"
        options={{
          headerLeft: () => <HeaderBackButton />,
          title: 'Takeout Assistant',
        }}
      />
    </Stack>
  )
}
