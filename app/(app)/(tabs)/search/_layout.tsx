import { Stack } from 'one'

export const SearchLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Search',
          headerSearchBarOptions: {
            placeholder: 'Search...',
          },
        }}
      />
    </Stack>
  )
}
