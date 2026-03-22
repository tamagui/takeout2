// web stub — push notifications only work on native
export type PushNotificationsRegistrationResult =
  | {
      success: true
      platform: 'ios' | 'android'
      expoPushToken: string
      nativePushToken: string
      permissionStatus: string
    }
  | {
      success: false
      error: 'unsupported-device' | 'permission-denied' | 'unknown'
      permissionStatus: string
      errorMessage?: string
    }

export const registerForPushNotificationsAsync =
  async (): Promise<PushNotificationsRegistrationResult> => ({
    success: false,
    error: 'unsupported-device',
    permissionStatus: 'undetermined',
    errorMessage: 'Push notifications are not supported on web.',
  })
