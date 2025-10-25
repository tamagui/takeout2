import type { OneRouter } from 'one'
import { PHONE_REGISTERED_USER_FAKE_EMAIL_DOMAIN } from './constants'

/**
 * Get the next onboarding step for the user.
 *
 * If the user is fully onboarded, returns null.
 *
 * NOTE: The `user` argument here should be the `user.user` object returned by `useUser`, not `useAuth`.
 */
export async function getNextOnboardingStep(
  user: Readonly<{
    email: string | true
    username: string | true
    name: string | true
    image: string | true
    notifications?: true
    whitelisted?: boolean
  }>,
  options?: {
    waitingListEnabled?: boolean
    userRole?: string
  }
): Promise<OneRouter.Href | null> {
  // Check whitelist status first (only if feature flag is enabled)
  if (
    options?.waitingListEnabled &&
    options?.userRole !== 'admin' &&
    user.whitelisted === false
  ) {
    return '/waiting-list'
  }

  if (
    !user.email ||
    (typeof user.email === 'string' &&
      (user.email.trim() === '' ||
        user.email.endsWith(PHONE_REGISTERED_USER_FAKE_EMAIL_DOMAIN)))
  ) {
    return '/stay-connected'
  }

  if (
    !user.username ||
    (typeof user.username === 'string' && user.username.trim() === '') // ||
    // !user.name ||
    // (typeof user.name === 'string' && user.name.trim() === '')
  ) {
    return '/profile-setup'
  }

  if (!user.image) {
    return '/avatar-setup'
  }

  // if (
  //   !user.notifications &&
  //   !isPushNotificationsSetupSkipped() &&
  //   !(await getIsPushNotificationsPermissionGranted())
  // ) {
  //   return '/notifications'
  // }

  return null
}
