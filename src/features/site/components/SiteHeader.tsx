import { Spacer, XStack, YStack } from 'tamagui'
import { LoginButton } from '~/features/auth/ui/LoginButton'
import { Link } from '~/interface/app/Link'
import { Logo } from '~/interface/app/Logo'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { PageContainer } from '~/interface/layout/PageContainer'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'

export const SiteHeader = () => {
  return (
    <YStack py="$4" bg="transparent">
      <PageContainer>
        <XStack items="center">
          <Link href="/">
            <Logo />
          </Link>

          <Spacer flex />

          <XStack gap="$4" items="center">
            <LoginButton />

            <Link href="/docs">
              <ButtonSimple>Docs</ButtonSimple>
            </Link>

            <ThemeSwitch />
          </XStack>
        </XStack>
      </PageContainer>
    </YStack>
  )
}
