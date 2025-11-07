import { SizableText, Spacer } from 'tamagui'
import { YStack, XStack } from 'tamagui'
import { Link } from '~/interface/app/Link'
import { Logo } from '~/interface/app/Logo'
import { PageContainer } from '~/interface/layout/PageContainer'

export const SiteHeader = () => {
  return (
    <YStack py="$4">
      <PageContainer>
        <XStack>
          <Link href="/">
            <Logo />
          </Link>

          <Spacer flex />

          <Link href="/docs">
            <SizableText>Docs</SizableText>
          </Link>
        </XStack>
      </PageContainer>
    </YStack>
  )
}
