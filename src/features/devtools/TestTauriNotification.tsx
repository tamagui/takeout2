import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { isTauri } from '@vxrn/helpers'

export const TestTauriNotification = () => {
  if (!isTauri) return null

  const testNotification = async () => {
    try {
      const { sendNotification, isPermissionGranted, requestPermission } = await import(
        '@tauri-apps/plugin-notification'
      )

      // Check permission
      let permissionGranted = await isPermissionGranted()

      if (!permissionGranted) {
        const permission = await requestPermission()
        permissionGranted = permission === 'granted'
      }

      if (permissionGranted) {
        sendNotification({
          title: 'Test Notification',
          body: 'This is a test notification from Tauri!',
          sound: 'default',
        })
      } else {
      }
    } catch (error) {
      console.error('Notification error:', error)
    }
  }

  return (
    <ButtonSimple onPress={testNotification} size="small">
      Test Tauri Notification
    </ButtonSimple>
  )
}
