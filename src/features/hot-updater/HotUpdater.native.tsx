// @ts-ignore - no hot-updater types
import { HotUpdater } from '@hot-updater/react-native'

import { useCallback, useEffect, useState } from 'react'
import { Alert, AppState, Platform } from 'react-native'
import { DYNAMIC_CONFIGS, FEATURE_FLAGS } from '~/features/feature-flags/featureFlags'
import { usePostHog } from '~/features/feature-flags/usePostHog'
import { HotUpdaterContext } from './context'
import type { HotUpdaterContextValue, HotUpdaterProviderProps } from './types'

/**
 * Native version of HotUpdaterProvider - actual implementation
 */
export function HotUpdaterProvider({
  children,
  authData = null,
}: HotUpdaterProviderProps) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)

  const posthog = usePostHog()

  // check if hot updates are enabled
  const isEnabled = posthog?.isFeatureEnabled(FEATURE_FLAGS.ENABLE_HOT_UPDATES) ?? false
  const serverUrl = posthog?.getFeatureFlag(DYNAMIC_CONFIGS.HOT_UPDATE_SERVER_URL) as
    | string
    | undefined

  const checkForUpdate = useCallback(async () => {
    if (!isEnabled) {
      console.info('Hot updates are disabled')
      return
    }

    try {
      console.info('Checking for updates...')
      setLastCheckTime(new Date())

      // check for updates with the server URL
      const update = await HotUpdater.checkForUpdate({
        source: serverUrl || '',
      })

      if (update) {
        console.info('Update available:', update.id)
        setIsUpdateAvailable(true)

        // track update available event with enriched properties
        const enrichedProps = {
          bundleId: update.id,
          currentBundleId: HotUpdater.getBundleId(),
          ...(authData && {
            userId: authData.id,
            userEmail: authData.email,
            userRole: authData.role,
          }),
        }
        posthog?.logEvent('hot_update_available', enrichedProps)
      } else {
        console.info('No updates available')
        setIsUpdateAvailable(false)
      }
    } catch (error) {
      console.error('Error checking for updates:', error)

      // track error with enriched properties
      const enrichedProps = {
        error: String(error),
        ...(authData && {
          userId: authData.id,
          userEmail: authData.email,
          userRole: authData.role,
        }),
      }
      posthog?.logEvent('hot_update_check_error', enrichedProps)
    }
  }, [isEnabled, serverUrl, posthog, authData])

  const applyUpdate = useCallback(async () => {
    if (!isUpdateAvailable || !serverUrl) {
      return
    }

    try {
      setIsDownloading(true)
      setDownloadProgress(0)

      // run the update process which handles download and apply
      const result = await HotUpdater.runUpdateProcess({
        source: serverUrl,
        reloadOnForceUpdate: false, // we'll handle the reload ourselves
      })

      // track download complete with enriched properties
      const enrichedProps = {
        status: result.status,
        ...(authData && {
          userId: authData.id,
          userEmail: authData.email,
          userRole: authData.role,
        }),
      }
      posthog?.logEvent('hot_update_downloaded', enrichedProps)

      if (result.status !== 'UP_TO_DATE' && result.shouldForceUpdate) {
        // show confirmation before restarting
        Alert.alert(
          'Update Downloaded',
          'The app will now restart to apply the update.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await HotUpdater.reload()
                // app will restart
              },
            },
          ],
          { cancelable: false }
        )
      }
    } catch (error) {
      console.error('Error applying update:', error)
      Alert.alert(
        'Update Failed',
        'Failed to download or apply the update. Please try again.'
      )

      // track error with enriched properties
      const enrichedErrorProps = {
        error: String(error),
        ...(authData && {
          userId: authData.id,
          userEmail: authData.email,
          userRole: authData.role,
        }),
      }
      posthog?.logEvent('hot_update_apply_error', enrichedErrorProps)
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }, [isUpdateAvailable, serverUrl, posthog, authData])

  // check for updates on mount and periodically
  useEffect(() => {
    if (!isEnabled) {
      return
    }

    // initial check
    checkForUpdate()

    // check every 30 minutes
    const interval = setInterval(checkForUpdate, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isEnabled, checkForUpdate])

  // listen for app foreground events to check for updates
  useEffect(() => {
    if (!isEnabled) {
      return
    }

    const handleAppStateChange = (state: string) => {
      if (state === 'active') {
        // check when app comes to foreground
        checkForUpdate()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription?.remove()
  }, [isEnabled, checkForUpdate])

  const contextValue: HotUpdaterContextValue = {
    isUpdateAvailable,
    isDownloading,
    downloadProgress,
    checkForUpdate,
    applyUpdate,
    lastCheckTime,
    authData,
  }

  return (
    <HotUpdaterContext.Provider value={contextValue}>
      {children}
    </HotUpdaterContext.Provider>
  )
}

export { useHotUpdater } from './context'
