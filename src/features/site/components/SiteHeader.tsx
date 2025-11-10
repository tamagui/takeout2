import { Spacer, XStack, YStack } from 'tamagui'
import { Link } from '~/interface/app/Link'
import { Logo } from '~/interface/app/Logo'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'

export const SiteHeader = () => {
  return (
    <YStack py="$4" bg="transparent">
      <XStack items="center">
        <Link href="/">
          <Logo />
        </Link>

        <Spacer flex />

        <XStack gap="$4" items="center">
          <Link href="/docs">
            <ButtonSimple>Docs</ButtonSimple>
          </Link>

          <ThemeSwitch />
        </XStack>
      </XStack>
    </YStack>
  )
}
