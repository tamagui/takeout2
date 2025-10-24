import { useAuth } from '~/auth/client/authClient'
import { useUserState } from '~/features/user/userState'

export const OnboardingTour = () => {
  const { user } = useAuth()
  const { tourState } = useUserState('settings')

  if (!user) {
    return null
  }

  // TODO guided tour after dialogOnboard finishes using guidedNavigation and a floating window we control

  return null
}
