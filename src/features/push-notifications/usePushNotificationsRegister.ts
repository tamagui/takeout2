import { useEffect } from 'react'
import * as Device from 'expo-device'
import { useAuth } from '~/auth/client/authClient'
import { zero } from '~/zero/client'
import { registerForPushNotificationsAsync } from './registerForPushNotificationsAsync'

export function usePushNotificationsRegister() {
  const { user, session } = useAuth()

  useEffect(() => {
    const userId = user?.id
    const sessionId = session?.id
    if (!userId || !sessionId) return

    ;(async () => {
      console.info('Registering device for push notifications...')
      const registration = await registerForPushNotificationsAsync()

      if (!registration.success) {
        console.warn(
          `Device push notifications registration failed: [${registration.error}] ${registration.errorMessage ?? ''}`
        )
        return
      }

      try {
        // Get additional device info
        const deviceName = Device.deviceName
        const brand = Device.brand
        const model = Device.modelName

        const deviceId = `${userId}-${sessionId}-${registration.type}-${registration.appBundleId}-${registration.deviceToken}`

        const deviceData = {
          id: deviceId,
          userId: userId,
          sessionId: sessionId,
          type: registration.type,
          name: deviceName,
          appBundleId: registration.appBundleId,
          deviceToken: registration.deviceToken,
          brand,
          model,
          createdAt: Date.now(),
        }

        await zero.mutate.device.upsert(deviceData)
      } catch (error) {
        console.error('Failed to save device registration:', error)
      }
    })()

    // Note: the `device` table has a foreign key to session(id) with ON DELETE CASCADE, so devices will be automatically cleaned up on logout
  }, [user?.id, session?.id])
}
