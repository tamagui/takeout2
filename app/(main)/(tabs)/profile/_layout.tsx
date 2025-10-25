import { Stack } from 'one'

export const ProfileLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen
        name="post/[feedId]"
        options={{
          animation: 'fade',
        }}
      />
    </Stack>
  )
}
