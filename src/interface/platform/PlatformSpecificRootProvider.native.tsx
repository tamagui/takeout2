import * as SplashScreen from 'expo-splash-screen'
import { useEffect, type ReactNode } from 'react'
import { LogBox } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { PortalProvider } from 'react-native-teleport'

import { useAuth } from '~/features/auth/client/authClient'

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

export function PlatformSpecificRootProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth()

  useEffect(() => {
    if (state !== 'loading') {
      SplashScreen.hide()
    }
  }, [state])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <PortalProvider>{children}</PortalProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
