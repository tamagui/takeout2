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
      <Stack.Screen
        name="index"
        options={{
          title: 'Search',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  )
}
