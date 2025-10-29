import { useFocusEffect, usePathname, useRouter } from 'one'
import { useCallback, useMemo } from 'react'
import { zero } from '~/zero/client'
import { useUser } from '~/features/user/useUser'
import { useGoBackToHome } from '~/hooks/useGoBackToHome'
import { getNextOnboardingStep } from './getNextOnboardingStep'
import type { OnboardingStep } from './types'

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
  const { state, user, isLoading } = useUser()
  const isLoggedIn = state === 'logged-in'
  const router = useRouter()
  const pathname = usePathname()
  const goBackToHome = useGoBackToHome()

  // Calculate the current step based on user data
  const currentStep = useMemo<OnboardingStep | null>(() => {
    if (!user) return null

    const nextRoute = getNextOnboardingStep(user, {
      waitingListEnabled: false,
      userRole: user.username === 'nate' || user.username === 'admin' ? 'admin' : 'user',
    })

    if (nextRoute === null) {
      return 'complete'
    }

    // Map routes to step names
    if (nextRoute === '/waiting-list') return 'waiting-list'
    if (nextRoute === '/profile-setup') return 'profile-setup'
    if (nextRoute === '/avatar-setup') return 'avatar-setup'
    if (nextRoute === '/stay-connected') return 'notifications' // Map to notifications for now
    if (nextRoute === '/notifications') return 'notifications'

    return null
  }, [user])

  const isComplete = currentStep === 'complete'

  // Navigate to the next onboarding step
  const goToNextStep = useCallback(async () => {
    if (!user) return

    const nextRoute = getNextOnboardingStep(user, {
      waitingListEnabled: false,
      userRole: user.username === 'nate' || user.username === 'admin' ? 'admin' : 'user',
    })

    if (nextRoute) {
      router.push(nextRoute)
    } else {
      // Onboarding complete - mark user as onboarded and go home
      await zero.mutate.userPublic.completeSignup(user.id)
      goBackToHome()
    }
  }, [user, router, goBackToHome])

  // Auto-redirect after login to appropriate onboarding step
  useFocusEffect(() => {
    if (!isLoading && isLoggedIn && user) {
      const nextRoute = getNextOnboardingStep(user, {
        waitingListEnabled: false,
        userRole: user.username === 'nate' || user.username === 'admin' ? 'admin' : 'user',
      })

      if (nextRoute) {
        // Prevent redundant navigation if we're already on the correct page
        if (pathname === nextRoute) {
          return
        }
        router.push(nextRoute)
      } else if (!user.hasOnboarded) {
        // Onboarding complete but not marked - mark it and go home
        ;(async () => {
          await zero.mutate.userPublic.completeSignup(user.id)
          goBackToHome()
        })()
      } else {
        // Already onboarded, go home
        goBackToHome()
      }
    }
  }, [isLoading, isLoggedIn, user, router, goBackToHome, pathname])

  return {
    currentStep,
    goToNextStep,
    isComplete,
  }
}
