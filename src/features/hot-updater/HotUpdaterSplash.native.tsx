import { HotUpdater } from '@take-out/native-hot-update'
import { ActivityIndicator } from 'react-native'
import { MMKV } from 'react-native-mmkv'
import { SizableText, View } from 'tamagui'

import { DEFAULT_HOT_UPDATE_SERVER_URL } from '~/constants/urls'

import { DYNAMIC_SERVER_URL_KEY, useHotUpdater } from './useHotUpdater'

import type { HotUpdaterResolver } from '@hot-updater/react-native'

// reads URL from MMKV on every update check, so PostHog changes apply same session
const mmkv = new MMKV({ id: 'hot-updater' })

const resolver: HotUpdaterResolver = {
  checkUpdate: async (params) => {
    const baseURL =
      mmkv.getString(DYNAMIC_SERVER_URL_KEY) || DEFAULT_HOT_UPDATE_SERVER_URL

    const strategyPath =
      params.updateStrategy === 'fingerprint'
        ? `fingerprint/${params.platform}/${params.fingerprintHash}`
        : `app-version/${params.platform}/${params.appVersion}`

    const url = `${baseURL}/${strategyPath}/${params.channel}/${params.minBundleId}/${params.bundleId}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), params.requestTimeout ?? 5_000)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...params.requestHeaders },
      })
      clearTimeout(timeoutId)
      if (response.status !== 200) return null
      return response.json()
    } catch {
      clearTimeout(timeoutId)
      return null
    }
  },
}

const SplashContent = ({ children }: { children?: React.ReactNode }) => {
  const { userClearedForAccess, progress } = useHotUpdater()

  if (!userClearedForAccess) {
    return (
      <View flex={1} items="center" justify="center" bg="$background">
        <ActivityIndicator size="large" />
        {progress > 0 && (
          <SizableText mt="$2" color="$color10">
            Downloading update... {Math.round(progress)}%
          </SizableText>
        )}
      </View>
    )
  }

  return <>{children}</>
}

// wrap() with custom resolver - reads dynamic URL from MMKV on each update check
export const HotUpdaterSplash = HotUpdater.wrap({
  resolver,
  updateMode: 'manual',
})(SplashContent)
