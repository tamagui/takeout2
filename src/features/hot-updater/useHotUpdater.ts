import { createHotUpdater } from '@take-out/native-hot-update'
import { createMMKVStorage } from '@take-out/native-hot-update/mmkv'
import { MMKV } from 'react-native-mmkv'

import { DYNAMIC_CONFIGS, FEATURE_FLAGS } from '~/features/feature-flags/featureFlags'
import { usePostHogClient } from '~/features/feature-flags/usePostHog'

const mmkv = new MMKV({ id: 'hot-updater' })

/**
 * Hook that provides OTA update functionality with feature flag integration.
 * Uses PostHog for feature flags and creates a dynamic hot updater instance.
 */
export function useHotUpdater() {
  const posthog = usePostHogClient()

  // get feature flags
  const isEnabled = posthog?.isFeatureEnabled(FEATURE_FLAGS.ENABLE_HOT_UPDATES) ?? false
  const serverUrl =
    (posthog?.getFeatureFlag(DYNAMIC_CONFIGS.HOT_UPDATE_SERVER_URL) as
      | string
      | undefined) || ''

  // create dynamic instance with current server URL
  const hotUpdater = createHotUpdater({
    serverUrl,
    storage: createMMKVStorage(mmkv),
    updateStrategy: 'appVersion',
  })

  return hotUpdater.useOtaUpdater({
    enabled: isEnabled && !!serverUrl,
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
