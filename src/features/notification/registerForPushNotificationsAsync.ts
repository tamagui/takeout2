import { isAndroid } from '@tamagui/constants'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'

type PushNotificationsRegistrationResult =
  | {
      success: true
      platform: 'ios' | 'android'
      expoPushToken: string // ExponentPushToken[...] for Expo Push API
      nativePushToken: string // APNs/FCM token for other services
      permissionStatus: Notifications.PermissionStatus
    }
  | {
      success: false
      error: 'unsupported-device' | 'permission-denied' | 'unknown'
      permissionStatus: Notifications.PermissionStatus
      errorMessage?: string
    }

export const registerForPushNotificationsAsync =
  async (): Promise<PushNotificationsRegistrationResult> => {
    // android requires notification channel
    if (isAndroid) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }

    // check if running on physical device
    if (!Device.isDevice) {
      return {
        success: false,
        permissionStatus: Notifications.PermissionStatus.UNDETERMINED,
        error: 'unsupported-device',
        errorMessage: 'Push notifications require a physical device.',
      }
    }

    // request permission
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
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      if (!projectId) {
        return {
          success: false,
          error: 'unknown',
          permissionStatus: finalStatus,
          errorMessage: 'Missing EAS projectId in app.config.ts',
        }
      }

      // get both tokens in parallel
      const [expoTokenData, nativeTokenData] = await Promise.all([
        Notifications.getExpoPushTokenAsync({ projectId }),
        Notifications.getDevicePushTokenAsync(),
      ])

      return {
        success: true,
        platform: isAndroid ? 'android' : 'ios',
        expoPushToken: expoTokenData.data, // ExponentPushToken[...]
        nativePushToken: nativeTokenData.data, // APNs/FCM token
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
