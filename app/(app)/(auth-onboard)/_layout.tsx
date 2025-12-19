import { Slot, Stack } from 'one'
import { isWeb, Spacer } from 'tamagui'

import { SiteHeader } from '~/features/site/ui/SiteHeader'
import { PageMainContainer } from '~/interface/layout/PageContainer'

export function AuthAndOnboardingLayout() {
  return (
    <>
      {isWeb ? (
        <>
          <SiteHeader />
          <PageMainContainer>
            {/* header height push down */}
            <Spacer size={70} />
            <Slot />
          </PageMainContainer>
        </>
      ) : (
        <Stack screenOptions={{ headerShown: false }} initialRouteName="login">
          <Stack.Screen name="login" />
          <Stack.Screen name="login/password" />
          <Stack.Screen name="signup/[method]" />
          <Stack.Screen name="signup/otp" />
          <Stack.Screen name="waiting-list" />
        </Stack>
      )}
    </>
  )
}
