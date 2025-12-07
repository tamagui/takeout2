import { useNavigation, useRouter } from 'one'
import { isWeb, useDebounce } from 'tamagui'

import { ROOT_MAIN_ROUTE_NAME } from '~/constants/navigation'

/**
 * Provides a function to navigate back to the home screen nicely under various
 * scenarios, such as after login or onboarding.
 */
export function useGoBackToHome() {
  const navigation = useNavigation()
  const router = useRouter()

  const goBackToHome = useDebounce(
    () => {
      if (isWeb) {
        router.replace('/home')
        return
      }

      let rootNavigation = navigation
      while (rootNavigation.getParent()) {
        rootNavigation = rootNavigation.getParent()
      }
      const oldState = rootNavigation.getState()
      if (oldState.index === 1 && oldState.routes[0]?.name === ROOT_MAIN_ROUTE_NAME) {
        rootNavigation.goBack()
      } else {
        const newState: typeof oldState = {
          index: 0,
          routes: [{ key: 'main', name: ROOT_MAIN_ROUTE_NAME, params: {} } as any],
        } as any
        navigation.reset(newState)
      }
    },
    1000,
    {
      leading: true,
    }
  )

  return goBackToHome
}
