import { Stack } from '~/interface/layouts/stack'

export default function SettingsModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="channel-settings" />
    </Stack>
  )
}
