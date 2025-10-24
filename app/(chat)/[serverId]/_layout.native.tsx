import { Stack } from '~/interface/layouts/stack'

export default function ServerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[channelId]" />
      <Stack.Screen name="[channelId]/thread/[messageId]" />
      <Stack.Screen
        name="[channelId]/settings"
        options={{
          presentation: 'modal',
        }}
      />
    </Stack>
  )
}
