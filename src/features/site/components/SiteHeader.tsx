import { Spacer, Theme, XStack, YStack } from 'tamagui'
import { LoginButton } from '~/features/auth/ui/LoginButton'
import { SocialLinksRow } from '~/features/site/components/SocialLinksRow'
import { Link } from '~/interface/app/Link'
import { Logo } from '~/interface/app/Logo'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { PageContainer } from '~/interface/layout/PageContainer'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'

export const SiteHeader = () => {
  return (
    <Theme name="dark">
      <YStack py="$4" bg="$color1">
        <PageContainer>
          <XStack px="$6" items="center">
            <Link href="/">
              <Logo />
            </Link>

            <Spacer flex />

            <XStack gap="$4" items="center">
              <XStack
                containerType="normal"
                items="center"
                gap="$2"
                $sm={{ justify: 'center' }}
              >
                <SocialLinksRow />
              </XStack>

              <LoginButton />

              <Link href="/docs">
                <ButtonSimple>Docs</ButtonSimple>
              </Link>

              <ThemeSwitch />
            </XStack>
          </XStack>
        </PageContainer>
      </YStack>
    </Theme>
  )
}
