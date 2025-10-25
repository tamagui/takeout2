import { useCallback } from 'react'
import { useUser } from '~/features/user/useUser'
import { getNextOnboardingStep } from '../getNextOnboardingStep'
import { useRouter } from 'one'
import { useGoBackToHome } from '~/hooks/useGoBackToHome'

export function useGoToNextOnboardingStep(
  filledFields: Array<keyof Parameters<typeof getNextOnboardingStep>[0]> = []
) {
  const user = useUser()
  const router = useRouter()

  const goBackToHome = useGoBackToHome()

  const goToNextOnboardingStep = useCallback(async () => {
    if (!user.user) return

    const nextStep = await getNextOnboardingStep({
      ...user.user,
      // Fields that were just filled
      ...Object.fromEntries(filledFields.map((field) => [field, true])),
    })

    if (nextStep) {
      router.push(nextStep)
    } else {
      goBackToHome()
    }
  }, [filledFields, user, router, goBackToHome])

  return goToNextOnboardingStep
}
