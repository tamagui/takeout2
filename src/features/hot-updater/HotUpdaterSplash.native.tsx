import { SizableText, Spinner, View } from 'tamagui'

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
        <Spinner size="large" />
        {progress > 0 && (
          <SizableText mt="$2" size="$3" color="$color12">
            Downloading update... {Math.round(progress)}%
          </SizableText>
        )}
      </View>
    )
  }

  return <>{children}</>
}
