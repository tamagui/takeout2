import { Slot, Stack } from 'one'
import { isWeb } from 'tamagui'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { PlatformSpecificRootProvider } from '~/providers/PlatformSpecificRootProvider'
import { ProvideZero } from '~/zero/client'

export function AppLayout() {
  return (
    <ProvideZero>
      <ToastProvider>
        <NotificationProvider>
          <PlatformSpecificRootProvider>
            <DragDropFile>
              {isWeb ? (
                <Slot />
              ) : (
                // We need Stack here for transition animation to work on native
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth-onboard)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="settings" />
                </Stack>
              )}
            </DragDropFile>
          </PlatformSpecificRootProvider>
        </NotificationProvider>
      </ToastProvider>
    </ProvideZero>
  )
}
