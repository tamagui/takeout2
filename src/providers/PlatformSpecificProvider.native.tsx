import * as SplashScreen from 'expo-splash-screen'
import { Stack } from 'one'
import { memo, useEffect, type ReactNode } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View } from 'tamagui'
import {
  ROOT_AUTH_ONBOARD_ROUTE_NAME,
  ROOT_MAIN_ROUTE_NAME,
} from '~/constants/navigation'
import { useAuth } from '~/features/auth/client/authClient'
import { HotUpdateAlertManager, HotUpdaterProvider } from '~/features/hot-updater'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'
import { ProvideZero } from '~/zero/client'

SplashScreen.setOptions({
  duration: 250,
  fade: true,
})
SplashScreen.preventAutoHideAsync()

export function PlatformSpecificProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth()

  useEffect(() => {
    if (state !== 'loading') {
      setTimeout(() => {
        SplashScreen.hide()
      }, 500)
    }
  }, [state])

  return (
    <ProvideZero>
      <TamaguiRootProvider>
        <SafeAreaProvider>
          <HotUpdaterProvider>
            <ToastProvider>
              <NotificationProvider>
                <KeyboardProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <View flex={1}>
                      <HotUpdateAlertManager />
                      <NavigationContent />
                    </View>
                  </GestureHandlerRootView>
                </KeyboardProvider>
              </NotificationProvider>
            </ToastProvider>
          </HotUpdaterProvider>
        </SafeAreaProvider>
      </TamaguiRootProvider>
    </ProvideZero>
  )
}

const NavigationContent = memo(() => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
      }}
      initialRouteName={ROOT_MAIN_ROUTE_NAME}
    >
      <Stack.Screen name={ROOT_MAIN_ROUTE_NAME} />
      <Stack.Screen
        name={ROOT_AUTH_ONBOARD_ROUTE_NAME}
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack>
  )
})
