import { Redirect, Slot } from 'one'
import type { ReactNode } from 'react'
import { getNextOnboardingStep } from '~/features/onboarding/getNextOnboardingStep'
import { useUser } from '~/features/user/useUser'
import { Dialogs } from '~/interface/dialogs/Dialogs'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { PlatformSpecificRootProvider } from '~/providers/PlatformSpecificRootProvider'
import { ProvideZero } from '~/zero/client'

export default function AppLayout() {
  const { user, state } = useUser()

  if (state === 'logged-out') {
    return <Redirect href="/login" />
  }

  if (state === 'loading' || !user) {
    return null
  }

  const nextStep = getNextOnboardingStep(user)
  if (nextStep) {
    return <Redirect href={nextStep} />
  }

  return (
    <MainProviders>
      <DragDropFile>
        <Dialogs />
        <Slot />
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
