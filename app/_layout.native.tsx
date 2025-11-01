import * as SplashScreen from 'expo-splash-screen'
import { Slot } from 'one'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '~/features/auth/client/authClient'
import { HotUpdateAlertManager, HotUpdaterProvider } from '~/features/hot-updater'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'
import { ProvideZero } from '~/zero/client'

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 250,
  fade: true,
})

SplashScreen.preventAutoHideAsync()

export function Layout() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      SplashScreen.hide()
    }
  }, [loading])

  return (
    <ProvideZero>
      <TamaguiRootProvider>
        <SafeAreaProvider>
          <HotUpdaterProvider>
            <ToastProvider>
              <NotificationProvider>
                <HotUpdateAlertManager />
                <Slot />
              </NotificationProvider>
            </ToastProvider>
          </HotUpdaterProvider>
        </SafeAreaProvider>
      </TamaguiRootProvider>
    </ProvideZero>
  )
}
