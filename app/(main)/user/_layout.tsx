import { Slot, Stack } from 'one'
import { isWeb } from 'tamagui'

export function ProfileLayout() {
  if (isWeb) {
    return <Slot />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="profile-edit-name" />
      <Stack.Screen name="profile-edit-avatar" />
      <Stack.Screen name="profile-edit-bio" />
      <Stack.Screen name="profile-edit-socials" />
      <Stack.Screen name="profile-blocked-users" />
    </Stack>
  )
}
