import '~/features/devtools/devGlobals'

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { memo } from 'react'
import { useColorScheme, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import { AppInitProvider, useAppInitContext } from '~/context/AppInitContext'
import { AppProvider } from '~/features/apps/ui/AppProvider'
import { usePushNotificationsRegister } from '~/features/push-notifications/usePushNotificationsRegister'
import { Stack } from '~/interface/layouts/stack'
import { Splash } from '~/interface/native/splash.native'
import { ToastProvider } from '~/interface/toast/Toast.native'
import { config } from '~/tamagui/tamagui.config'
import { ProvideZero } from '~/zero/client'

export default function Layout() {
  usePushNotificationsRegister()

  return (
    <ProvideZero>
      <AppInitProvider>
        <AppProvider>
          <LayoutInner />
        </AppProvider>
      </AppInitProvider>
    </ProvideZero>
  )
}

const LayoutInner = memo(() => {
  // const [animationEnded, setAnimationEnded] = useState<boolean>(false)
  const { isNavigationReady } = useAppInitContext()

  // splash is ready when:
  // 1. auth is fully loaded
  // 2. if logged in: wait for redirect complete
  // 3. if not logged in: ready immediately for auth screen

  return (
    <ThemeProvider>
      <KeyboardProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Splash startAnimation={isNavigationReady}>
            <SafeAreaProvider>
              <ToastProvider>
                <PortalProvider>
                  <BottomSheetModalProvider>
                    <View style={{ flex: 1 }}>
                      <Stack>
                        <Stack.Screen
                          name="(chat)"
                          options={{
                            headerShown: false,
                          }}
                        />
                        <Stack.Screen
                          name="auth"
                          options={{
                            headerShown: false,
                            animation: 'fade',
                          }}
                        />
                        <Stack.Screen
                          name="ai"
                          options={{
                            headerShown: false,
                            animation: 'slide_from_bottom',
                          }}
                        />
                      </Stack>
                      {/* Global Floating AI Input - only show when logged in and animation ended */}
                      {/* {animationEnded && loggedIn && (
                    <FloatingAIInput
                      isShow={animationEnded && loggedIn}
                      userAvatar={
                        user?.image ||
                        'https://avatars.githubusercontent.com/u/17813202?v=4'
                      }
                      onSendMessage={handleAINavigation}
                    />
                  )} */}
                    </View>
                    <PortalHost name="root" />
                  </BottomSheetModalProvider>
                </PortalProvider>
              </ToastProvider>
            </SafeAreaProvider>
          </Splash>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </ThemeProvider>
  )
})

const ThemeProvider = memo(({ children }: { children: any }) => {
  const scheme = useColorScheme()
  return (
    <TamaguiProvider disableInjectCSS config={config} defaultTheme={scheme || 'dark'}>
      {children}
    </TamaguiProvider>
  )
})
