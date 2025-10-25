import { useNavigation } from 'one'
import { useDebounce } from 'tamagui'
import { ROOT_MAIN_ROUTE_NAME } from '~/constants/navigation'

/**
 * Provides a function to navigate back to the home screen nicely under various
 * scenarios, such as after login or onboarding.
 */
export function useGoBackToHome() {
  const navigation = useNavigation()

  const goBackToHome = useDebounce(
    () => {
      let rootNavigation = navigation
      while (rootNavigation.getParent()) {
        rootNavigation = rootNavigation.getParent()
      }
      const oldState = rootNavigation.getState()
      if (oldState.index === 1 && oldState.routes[0]?.name === ROOT_MAIN_ROUTE_NAME) {
        // If navigation history is clean (route 0 is the main route, and route 1 is the login route), we can simply go back. This also will have nice animations out of the box.
        rootNavigation.goBack()
      } else {
        // Otherwise, we reset the navigation state to have only the main route.
        const newState: typeof oldState = {
          // ...navigation.getState(),
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
