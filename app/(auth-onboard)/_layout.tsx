import { Slot } from 'one'
import { Theme, XStack } from 'tamagui'
import { Logo } from '~/interface/app/Logo'
import { PageContainer } from '~/interface/layout/PageContainer'

export function AuthAndOnboardingLayout() {
  return (
    <>
      <Theme inverse>
        <XStack py="$2" bg="$color1">
          <PageContainer>
            <Logo />
          </PageContainer>
        </XStack>
      </Theme>

      <PageContainer>
        <Slot />
      </PageContainer>
    </>
  )
}
