import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications'
import { useCallback, useEffect, useState } from 'react'
import { Alert, AppState, Linking } from 'react-native'

import { useAuth } from '~/features/auth/client/authClient'

import { registerDevice } from './registerDevice'

export const useNotificationStatus = () => {
  const { user } = useAuth()
  const [isToggleActive, setIsToggleActive] = useState<boolean>(false)
  const [canAskAgain, setCanAskAgain] = useState<boolean>(true)

  const checkNotificationPermissions = useCallback(async () => {
    const status = await getPermissionsAsync()
    setIsToggleActive(status.granted)
    setCanAskAgain(status.canAskAgain)
  }, [])

  const openSettings = useCallback(() => {
    Linking.openSettings()
  }, [])

  const handleToggle = useCallback(async () => {
    if (isToggleActive) {
      // user wants to disable - send them to settings
      Alert.alert(
        'Disable Notifications',
        'To disable notifications, please go to your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ]
      )
      return
    }

    // user wants to enable
    if (!canAskAgain) {
      // previously denied - must go to settings
      Alert.alert(
        'Enable Notifications',
        'Notifications were previously disabled. Please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ]
      )
      return
    }

    // request permission and register device with backend
    const status = await requestPermissionsAsync()
    if (status.granted) {
      setIsToggleActive(true)
      if (user?.id) {
        await registerDevice(user.id).catch((err) => {
          console.error('failed to register device:', err)
        })
      }
    } else {
      setCanAskAgain(status.canAskAgain)
    }
  }, [isToggleActive, canAskAgain, openSettings, user?.id])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkNotificationPermissions()
      }
    })
    checkNotificationPermissions()

    return () => subscription?.remove?.()
  }, [checkNotificationPermissions])

  return {
    isToggleActive,
    setIsToggleActive,
    handleToggle,
    checkNotificationPermissions,
  }
}
