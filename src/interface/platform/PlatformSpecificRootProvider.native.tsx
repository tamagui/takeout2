import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState, type ReactNode } from 'react'
import { LogBox } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'

import { useAuth } from '~/features/auth/client/authClient'

import { Splash } from '../splash/splash'

// TODO properly clean these up
LogBox.ignoreLogs([
  'clientID=',
  'Got unexpected socket close event',
  'Failed to connect',
  'WebSocket connection closed abruptly',
  'findNodeHandle is deprecated',
  'findHostInstance_DEPRECATED is deprecated',
  `Can't perform a React state update`,
])

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        {showSplash && (
          <Splash
            isReady={true}
            onAnimationEnd={() => {
              splashHasBeenShown = true
              setShowSplash(false)
            }}
          />
        )}
        {children}
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
