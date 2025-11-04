import { Slot } from 'one'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { HotUpdateAlertManager, HotUpdaterProvider } from '~/features/hot-updater'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'
import { ProvideZero } from '~/zero/client'

export function PlatformSpecificProvider() {
  return (
    <div style={{ display: 'contents' }} data-testid="app-container">
      <ProvideZero>
        <TamaguiRootProvider>
          <SafeAreaProvider>
            <HotUpdaterProvider>
              <ToastProvider>
                <NotificationProvider>
                  <DragDropFile>
                    <HotUpdateAlertManager />
                    <Slot />
                  </DragDropFile>
                </NotificationProvider>
              </ToastProvider>
            </HotUpdaterProvider>
          </SafeAreaProvider>
        </TamaguiRootProvider>
      </ProvideZero>
    </div>
  )
}
