import { Redirect, Slot } from 'one'
import { getNextOnboardingStep } from '~/features/onboarding/getNextOnboardingStep'
import { useUser } from '~/features/user/useUser'
import { Dialogs } from '~/interface/dialogs/Dialogs'

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
    <>
      <Dialogs />
      <Slot />
    </>
  )
}
