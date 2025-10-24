import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import * as Application from 'expo-application'

type PushNotificationsRegistrationResult =
  | {
      success: true
      appBundleId: string
      type: 'ios' | 'android'
      deviceToken: string
      permissionStatus: Notifications.PermissionStatus
    }
  | {
      success: false
      error: 'unsupported-device' | 'permission-denied' | 'unknown'
      permissionStatus: Notifications.PermissionStatus
      errorMessage?: string
    }

export async function registerForPushNotificationsAsync(): Promise<PushNotificationsRegistrationResult> {
  // if (Platform.OS === 'android') {
  //   await Notifications.setNotificationChannelAsync('myNotificationChannel', {
  //     name: 'A channel is needed for the permissions prompt to appear',
  //     importance: Notifications.AndroidImportance.MAX,
  //     vibrationPattern: [0, 250, 250, 250],
  //     lightColor: '#FF231F7C',
  //   });
  // }

  if (!Device.isDevice) {
    return {
      success: false,
      permissionStatus: Notifications.PermissionStatus.UNDETERMINED,
      error: 'unsupported-device',
      errorMessage: 'Push notifications is not supported on simulators/emulators.',
    }
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return {
      success: false,
      error: 'permission-denied',
      permissionStatus: finalStatus,
    }
  }

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync()
    const bundleId = Application.applicationId || ''

    if (tokenData.type !== 'ios' && tokenData.type !== 'android') {
      return {
        success: false,
        error: 'unsupported-device',
        permissionStatus: finalStatus,
        errorMessage: `Unsupported push token type: ${tokenData.type}`,
      }
    }

    return {
      success: true,
      appBundleId: bundleId,
      type: tokenData.type,
      deviceToken: tokenData.data,
      permissionStatus: finalStatus,
    }
  } catch (error) {
    return {
      success: false,
      error: 'unknown',
      permissionStatus: finalStatus,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}
