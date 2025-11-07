import { Slot } from 'one'
import type { ReactNode } from 'react'
import { Theme, XStack } from 'tamagui'
import { Logo } from '~/interface/app/Logo'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { PageContainer } from '~/interface/layout/PageContainer'
import { PlatformSpecificRootProvider } from '~/providers/PlatformSpecificRootProvider'
import { ProvideZero } from '~/zero/client'

export function AuthAndOnboardingLayout() {
  return (
    <MainProviders>
      <DragDropFile>
        <Theme inverse>
          <XStack py="$2" bg="$color1">
            <PageContainer>
              <Logo />
            </PageContainer>
          </XStack>
        </Theme>

        <PageContainer>
          <Slot />
        </PageContainer>
      </DragDropFile>
    </MainProviders>
  )
}

function MainProviders({ children }: { children: ReactNode }) {
  return (
    <ProvideZero>
      <ToastProvider>
        <NotificationProvider>
          <PlatformSpecificRootProvider>{children}</PlatformSpecificRootProvider>
        </NotificationProvider>
      </ToastProvider>
    </ProvideZero>
  )
}
