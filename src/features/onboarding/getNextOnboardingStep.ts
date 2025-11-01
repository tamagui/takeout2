import type { OneRouter } from 'one'
import type { User } from '~/data/types'

/**
 * Get the next onboarding step for the user.
 *
 * If the user is fully onboarded, returns null.
 *
 * NOTE: The `user` argument here should be the `user.user` object returned by `useUser`, not `useAuth`.
 */
export function getNextOnboardingStep(
  user: User,
  options?: {
    waitingListEnabled?: boolean
    userRole?: string
  }
): OneRouter.Href | null {
  // Check whitelist status first (only if feature flag is enabled)
  if (
    options?.waitingListEnabled &&
    options?.userRole !== 'admin' &&
    user.whitelisted === false
  ) {
    return '/waiting-list'
  }

  if (
    !user.username ||
    (typeof user.username === 'string' && user.username.trim() === '')
  ) {
    return '/profile-setup'
  }

  if (!user.image) {
    return '/avatar-setup'
  }

  return null
}
