import { createHotUpdater } from '@take-out/native-hot-update'
import { createMMKVStorage } from '@take-out/native-hot-update/mmkv'
import { useEffect } from 'react'
import { MMKV } from 'react-native-mmkv'

import { DYNAMIC_CONFIGS, FEATURE_FLAGS } from '~/features/feature-flags/featureFlags'
import { usePostHogClient } from '~/features/feature-flags/usePostHog'

const mmkv = new MMKV({ id: 'hot-updater' })

// module-level instance so useOtaUpdater is the same function every render
const hotUpdater = createHotUpdater({
  storage: createMMKVStorage(mmkv),
  updateStrategy: 'appVersion',
})

// MMKV key for persisting the dynamic server URL across launches
export const DYNAMIC_SERVER_URL_KEY = 'hotUpdater.dynamicServerUrl'

/**
 * Hook that provides OTA update functionality with feature flag integration.
 * Gated by PostHog ENABLE_HOT_UPDATES flag.
 * If HOT_UPDATE_SERVER_URL is set in PostHog, it's persisted to MMKV and used
 * on next app launch (overriding DEFAULT_HOT_UPDATE_SERVER_URL).
 */
export function useHotUpdater() {
  const posthog = usePostHogClient()

  const isEnabled = posthog?.isFeatureEnabled(FEATURE_FLAGS.ENABLE_HOT_UPDATES) ?? false
  const dynamicServerUrl =
    (posthog?.getFeatureFlag(DYNAMIC_CONFIGS.HOT_UPDATE_SERVER_URL) as
      | string
      | undefined) || ''

  // persist dynamic URL to MMKV so HotUpdaterSplash can read it on next launch
  useEffect(() => {
    if (!posthog) return
    if (dynamicServerUrl) {
      mmkv.set(DYNAMIC_SERVER_URL_KEY, dynamicServerUrl)
    } else {
      mmkv.delete(DYNAMIC_SERVER_URL_KEY)
    }
  }, [posthog, dynamicServerUrl])

  return hotUpdater.useOtaUpdater({
    enabled: isEnabled,
    onUpdateDownloaded: (info) => {
      console.info('OTA update downloaded:', info.id)
      posthog?.logEvent('ota_update_downloaded', {
        bundleId: info.id,
        isCriticalUpdate: info.isCriticalUpdate,
        fileUrl: info.fileUrl,
        message: info.message,
      })
    },
    onError: (error) => {
      console.error('OTA update error:', error)
      posthog?.logEvent('ota_update_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })
}
