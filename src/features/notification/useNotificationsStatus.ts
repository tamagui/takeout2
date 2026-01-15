import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications'
import { useCallback, useEffect, useState } from 'react'
import { Alert, AppState } from 'react-native'

export const useNotificationStatus = () => {
  const [isToggleActive, setIsToggleActive] = useState<boolean>(true)

  const checkNotificationPermissions = useCallback(async () => {
    const status = await getPermissionsAsync()
    const shouldBeActive = status.granted
    setIsToggleActive(shouldBeActive)
  }, [])

  const handleToggle = useCallback(
    async (
      onGranted: () => void,
      options: { onDenied?: () => void; isForSetting?: boolean } = {}
    ) => {
      const { onDenied, isForSetting } = options
      if (!isToggleActive) {
        const status = await requestPermissionsAsync()
        if (status.granted) {
          onGranted()
          setIsToggleActive(true)
        } else {
          Alert.alert(
            'Notification Permission',
            'Notifications are not enabled. You can enable them in your device settings.',
            [
              {
                text: 'OK',
                style: 'cancel',
              },
            ]
          )
        }
      } else {
        setIsToggleActive(!isToggleActive)
        onGranted()
      }
    },
    [isToggleActive]
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkNotificationPermissions()
      }
    })
    checkNotificationPermissions()

    return () => subscription.remove()
  }, [checkNotificationPermissions])

  return {
    isToggleActive,
    setIsToggleActive,
    handleToggle,
    checkNotificationPermissions,
  }
}
