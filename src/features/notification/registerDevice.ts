import { zero } from '~/zero/client'

import { registerForPushNotificationsAsync } from './registerForPushNotificationsAsync'

type RegisterDeviceResult =
  | { success: true; deviceId: string }
  | { success: false; error: string }

// register device and save expo push token to database via zero mutations
export const registerDevice = async (userId: string): Promise<RegisterDeviceResult> => {
  if (!userId) {
    return { success: false, error: 'user-id-required' }
  }

  const result = await registerForPushNotificationsAsync()

  if (!result.success) {
    return { success: false, error: result.error }
  }

  const deviceId = `${userId}_${result.platform}`

  try {
    await zero.mutate.device.upsert({
      id: deviceId,
      userId,
      platform: result.platform,
      pushToken: result.expoPushToken,
      pushEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    console.info('[registerDevice] device upserted:', deviceId)

    return { success: true, deviceId }
  } catch (error) {
    console.error('[registerDevice] failed:', error)
    return { success: false, error: 'database-error' }
  }
}

// disable push notifications for a device
export const disableDevicePush = async (userId: string, platform: 'ios' | 'android') => {
  const deviceId = `${userId}_${platform}`

  try {
    await zero.mutate.device.update({
      id: deviceId,
      pushEnabled: false,
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}
