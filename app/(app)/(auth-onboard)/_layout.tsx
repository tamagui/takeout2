import { isNative } from '@take-out/helpers'
import { Redirect, Slot } from 'one'
import { getNextOnboardingStep } from '~/features/onboarding/getNextOnboardingStep'
import { SiteHeader } from '~/features/site/components/SiteHeader'
import { useUser } from '~/features/user/useUser'
import { GridBackground } from '~/interface/backgrounds/GridBackground'
import { PageContainer } from '~/interface/layout/PageContainer'

export function AuthAndOnboardingLayout() {
  const { user, state } = useUser()

  console.log('state', state)

  // if (state === 'logged-out') {
  //   return <Redirect href="/login" />
  // }

  // if (state === 'loading' || !user) {
  //   return null
  // }

  // const nextStep = getNextOnboardingStep(user)

  // if (nextStep) {
  //   return <Redirect href={nextStep} />
  // }

  if (isNative) {
    return <Slot />
  }

  return (
    <>
      <GridBackground />
      <SiteHeader />
      <PageContainer>
        <Slot />
      </PageContainer>
    </>
  )
}
