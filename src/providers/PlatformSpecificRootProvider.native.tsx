import * as SplashScreen from 'expo-splash-screen'
import { useEffect, type ReactNode } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { View } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'

export function PlatformSpecificRootProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth()

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
        <View flex={1}>{children}</View>
      </GestureHandlerRootView>
    </KeyboardProvider>
  )
}
