import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { useHotUpdater } from './context'

/**
 * Native version of hot update alert using React Native's Alert API
 */
export function useHotUpdateAlert() {
  const { isUpdateAvailable, isDownloading, downloadProgress, applyUpdate } =
    useHotUpdater()

  // track if we've already shown the alert for this update
  const alertShownRef = useRef(false)

  useEffect(() => {
    // show alert when update becomes available
    if (isUpdateAvailable && !isDownloading && !alertShownRef.current) {
      alertShownRef.current = true

      Alert.alert(
        'Update Available',
        'A new version of the app is available. Would you like to update now?',
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => {
              console.info('User declined update')
            },
          },
          {
            text: 'Update Now',
            onPress: () => {
              console.info('User accepted update')
              applyUpdate()
            },
          },
        ],
        { cancelable: true }
      )
    }

    // reset alert shown flag when update is no longer available
    if (!isUpdateAvailable) {
      alertShownRef.current = false
    }
  }, [isUpdateAvailable, isDownloading, applyUpdate])

  // show progress alert if downloading
  useEffect(() => {
    if (isDownloading && downloadProgress > 0) {
      // note: react native Alert doesn't support updating content
      // so we only log progress for debugging purposes
      console.info(`Download progress: ${Math.round(downloadProgress * 100)}%`)
    }
  }, [isDownloading, downloadProgress])

  return null
}
