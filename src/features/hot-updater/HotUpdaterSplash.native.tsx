import { HotUpdater } from '@take-out/native-hot-update'
import { ActivityIndicator } from 'react-native'
import { SizableText, View } from 'tamagui'

import { DEFAULT_HOT_UPDATE_SERVER_URL } from '~/constants/urls'

import { useHotUpdater } from './useHotUpdater'

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

// wrap() initializes HotUpdater config - required for checkForUpdate to work
export const HotUpdaterSplash = HotUpdater.wrap({
  baseURL: DEFAULT_HOT_UPDATE_SERVER_URL,
  updateMode: 'manual',
})(SplashContent)
