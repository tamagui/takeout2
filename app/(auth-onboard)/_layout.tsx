import { Slot } from 'one'
import type { ReactNode } from 'react'
import { SiteHeader } from '~/features/site/components/SiteHeader'
import { PageContainer } from '~/interface/layout/PageContainer'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { PlatformSpecificRootProvider } from '~/providers/PlatformSpecificRootProvider'

export function AuthAndOnboardingLayout() {
  return (
    <MainProviders>
      <DragDropFile>
        <SiteHeader />
        <PageContainer>
          <Slot />
        </PageContainer>
      </DragDropFile>
    </MainProviders>
  )
}

function MainProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <NotificationProvider>
        <PlatformSpecificRootProvider>{children}</PlatformSpecificRootProvider>
      </NotificationProvider>
    </ToastProvider>
  )
}
