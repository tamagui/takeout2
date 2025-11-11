import { useFocusEffect, usePathname, useRouter } from 'one'
import { useMemo } from 'react'
import { useEvent } from 'tamagui'
import { useUser } from '~/features/user/useUser'
import { useGoBackToHome } from '~/hooks/useGoBackToHome'
import { zero } from '~/zero/client'
import { getNextOnboardingStep } from './getNextOnboardingStep'
import type { OnboardingStep } from './types'

const isAdminUser = (username?: string) => username === 'nate' || username === 'admin'

/**
 * A single hook to manage the entire onboarding flow.
 *
 * Returns:
 * - currentStep: The current onboarding step the user should be on ('waiting-list' | 'profile-setup' | 'avatar-setup' | 'notifications' | 'complete' | null)
 * - goToNextStep: A function to navigate to the next onboarding step (knows internally what to do)
 * - isComplete: Whether the user has completed onboarding
 *
 * Also handles auto-redirect after login by checking onboarding status on page focus.
 */
export function useOnboarding() {
  const { user, isLoading } = useUser()

  console.info('[onboarding:hook]', {
    user,
    isLoading,
  })

  const router = useRouter()
  const pathname = usePathname()
  const goBackToHome = useGoBackToHome()

  const onboardingConfig = useMemo(
    () => ({
      waitingListEnabled: false,
      userRole: isAdminUser(user?.username ?? undefined) ? 'admin' : ('user' as const),
    }),
    [user?.username]
  )

  // Calculate the current step based on user data
  const currentStep = useMemo<OnboardingStep | null>(() => {
    if (!user) return null

    const nextRoute = getNextOnboardingStep(user, onboardingConfig)

    if (nextRoute === null) {
      return 'complete'
    }

    // Map routes to step names
    if (nextRoute === '/waiting-list') return 'waiting-list'
    if (nextRoute === '/profile-setup') return 'profile-setup'
    if (nextRoute === '/avatar-setup') return 'avatar-setup'

    return null
  }, [user, onboardingConfig])

  const isComplete = currentStep === 'complete'

  // Navigate to the next onboarding step
  const goToNextStep = useEvent(async () => {
    console.info('[onboarding:goToNextStep]', {
      user,
      onboardingConfig,
    })
    if (!user) return

    const nextRoute = getNextOnboardingStep(user, onboardingConfig)

    if (nextRoute) {
      router.push(nextRoute)
    } else {
      // Onboarding complete - mark user as onboarded and go home
      await zero.mutate.userPublic.completeSignup(user.id)
      goBackToHome()
    }
  })

  const completeSignupAndGoHome = useEvent(async () => {
    if (!user) return
    await zero.mutate.userPublic.completeSignup(user.id)
    goBackToHome()
  })

  useFocusEffect(() => {
    console.info('[onboarding:focus]', {
      isLoading,
      hasUser: !!user,
      pathname,
      userId: user?.id,
    })

    // if (!isLoading && user) {
    //   const nextRoute = getNextOnboardingStep(user, onboardingConfig)

    //   console.info('[onboarding:redirect]', {
    //     nextRoute,
    //     currentPath: pathname,
    //     hasOnboarded: user.hasOnboarded,
    //   })

    //   if (nextRoute) {
    //     if (pathname === nextRoute) {
    //       console.info('[onboarding:skip] already on target route')
    //       return
    //     }
    //     console.info('[onboarding:navigate]', { to: nextRoute })
    //     router.push(nextRoute)
    //   } else if (!user.hasOnboarded) {
    //     console.info('[onboarding:complete] completing signup and going home')
    //     completeSignupAndGoHome()
    //   } else {
    //     console.info('[onboarding:home] going to home')
    //     goBackToHome()
    //   }
    // }
  }, [isLoading, user?.id, pathname])

  return {
    currentStep,
    goToNextStep,
    isComplete,
  }
}
