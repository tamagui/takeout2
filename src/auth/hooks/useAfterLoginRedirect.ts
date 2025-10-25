import { useFocusEffect, usePathname, useRouter } from 'one'
import { FEATURE_FLAGS } from '~/features/feature-flags'
import { useUser } from '~/features/user/useUser'
import { useGoBackToHome } from '~/hooks/useGoBackToHome'
import { useStatsigClient } from '~/features/feature-flags/usePostHog'
import { getNextOnboardingStep } from '../getNextOnboardingStep'

/**
 * Use this hook in every page that is part of the login flow to navigate the
 * user to the appropriate next step after login.
 */
export function useAfterLoginRedirect() {
  const { state, user, isLoading } = useUser()
  const isLoggedIn = state === 'logged-in'
  const { client } = useStatsigClient()
  const waitingListEnabled = client.checkGate(FEATURE_FLAGS.WAITING_LIST_ENABLE)

  const goBackToHome = useGoBackToHome()

  const router = useRouter()
  const pathname = usePathname()

  useFocusEffect(() => {
    if (!isLoading && isLoggedIn && user) {
      getNextOnboardingStep(user, { waitingListEnabled, userRole: 'user' }).then(
        (nextStep) => {
          if (nextStep) {
            // Prevent redundant navigation if we're already on the correct page
            if (pathname === nextStep) {
              return
            }

            router.push(nextStep)
          } else {
            goBackToHome()
          }
        }
      )
    }
  }, [isLoading, isLoggedIn, user, router, goBackToHome, waitingListEnabled, pathname])
}
