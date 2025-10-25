import { Stack } from 'one'

export default function ProfileLayout() {
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
