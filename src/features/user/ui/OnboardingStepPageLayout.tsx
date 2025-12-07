import { useFocusEffect, useNavigation } from 'one'
import { useState } from 'react'

import { isSmallScreen } from '~/interface/dimensions'
import { StepPageLayout } from '~/interface/pages/StepPageLayout'

export function OnboardingStepPageLayout(
  props: React.ComponentProps<typeof StepPageLayout>
) {
  const navigation = useNavigation()
  const [canGoBack, setCanGoBack] = useState(false)

  useFocusEffect(() => {
    const navigationState = navigation.getState()
    const currentIndex = navigationState.index

    // Do not allow going back if we are at the first screen of the stack.
    // This prevents the parent navigator from handling the back action
    // which will dismiss the entire onboarding flow.
    if (currentIndex <= 0) {
      setCanGoBack(false)
      return
    }

    const previousRoute = navigationState.routes[currentIndex - 1]
    const previousRouteName = previousRoute?.name || ''

    // Do not allow going back from onboarding to signup/login.
    if (
      previousRouteName.startsWith('signup') ||
      previousRouteName.startsWith('signin') ||
      previousRouteName.startsWith('login')
    ) {
      setCanGoBack(false)
      return
    }

    setCanGoBack(true)
  }, [navigation])

  return (
    <StepPageLayout
      disableBackButton={!canGoBack}
      disableScroll={!isSmallScreen}
      {...props}
    />
  )
}
