import { ActivityIndicator, Text } from 'react-native'
import { View } from 'tamagui'

import { useHotUpdater } from './useHotUpdater'

interface HotUpdaterSplashProps {
  children: React.ReactNode
}

/**
 * Component that shows a splash screen during hot update checks.
 * Automatically hides after timeout or when update check completes.
 */
export function HotUpdaterSplash({ children }: HotUpdaterSplashProps) {
  const { userClearedForAccess, progress } = useHotUpdater()

  if (!userClearedForAccess) {
    return (
      <View flex={1} items="center" justify="center" bg="$background">
        <ActivityIndicator size="large" />
        {progress > 0 && (
          <Text style={{ marginTop: 16, color: '#666' }}>
            Downloading update... {Math.round(progress)}%
          </Text>
        )}
      </View>
    )
  }

  return <>{children}</>
}
