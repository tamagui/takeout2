import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState, type ReactNode } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { View } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'

import { Splash } from '../splash/splash'

let splashHasBeenShown = false

export function PlatformSpecificRootProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const [showSplash, setShowSplash] = useState<boolean>(!splashHasBeenShown)

  useEffect(() => {
    if (state !== 'loading') {
      setTimeout(() => {
        SplashScreen.hide()
        // NOTE: just wait for the transition animation to complete
      }, 500)
    }
  }, [state])

  return (
    <KeyboardProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {showSplash && (
          <Splash
            isReady={true}
            onAnimationEnd={() => {
              splashHasBeenShown = true
              setShowSplash(false)
            }}
          />
        )}
        <View flex={1}>{children}</View>
      </GestureHandlerRootView>
    </KeyboardProvider>
  )
}
