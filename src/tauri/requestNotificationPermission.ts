export async function requestNotificationPermission() {
  const { isPermissionGranted, requestPermission } = await import(
    '@tauri-apps/plugin-notification'
  )

  // Do you have permission to send a notification?
  let permissionGranted = await isPermissionGranted()

  // If not we need to request it
  if (!permissionGranted) {
    const permission = await requestPermission()
    permissionGranted = permission === 'granted'
  }
}
