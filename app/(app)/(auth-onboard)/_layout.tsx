import { isNative } from '@take-out/helpers'
import { router, Slot, useFocusEffect, usePathname } from 'one'
import { getNextOnboardingStep } from '~/features/onboarding/getNextOnboardingStep'
import { SiteHeader } from '~/features/site/ui/SiteHeader'
import { useUser } from '~/features/user/useUser'
import { PageContainer } from '~/interface/layout/PageContainer'

export function AuthAndOnboardingLayout() {
  const pathname = usePathname()
  const { user, state } = useUser()

  useFocusEffect(() => {
    if (state === 'logged-out' && pathname !== '/login') {
      router.replace('/login')
    }

    if (state === 'loading' || !user) {
      return
    }

    const nextStep = getNextOnboardingStep(user)

    router.replace(nextStep ?? '/home')
  }, [state, user])

  if (isNative) {
    return <Slot />
  }

  return (
    <>
      <SiteHeader />
      <PageContainer>
        <Slot />
      </PageContainer>
    </>
  )
}
