import * as Notifications from 'expo-notifications'

export async function isPermissionsGranted() {
  const { status } = await Notifications.getPermissionsAsync()
  return status === Notifications.PermissionStatus.GRANTED
}
