'use client'

import { Spacer, XStack, YStack } from 'tamagui'
import { LoginButton } from '~/features/auth/ui/LoginButton'
import { SocialLinksRow } from '~/features/site/components/SocialLinksRow'
import { Link } from '~/interface/app/Link'
import { Logo } from '~/interface/app/Logo'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { PageContainer } from '~/interface/layout/PageContainer'
import { ScrollHeader } from '~/interface/headers/ScrollHeader'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'

export const SiteHeader = () => {
  return (
    <ScrollHeader>
      <PageContainer>
        <YStack width="100%" py="$2.5">
          <XStack width="100%" px="$6" items="center">
            <Link href="/">
              <Logo />
            </Link>

            <Spacer flex />

            <XStack gap="$4" items="center">
              <XStack containerType="normal" items="center">
                <SocialLinksRow />
              </XStack>

              <LoginButton />

              <Link href="/docs">
                <ButtonSimple>Docs</ButtonSimple>
              </Link>

              <ThemeSwitch />
            </XStack>
          </XStack>
        </YStack>
      </PageContainer>
    </ScrollHeader>
  )
}
