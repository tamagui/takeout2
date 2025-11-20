import { router } from 'one'
import { Linking } from 'react-native'
import { XStack, YStack } from 'tamagui'
import { DISCORD_INVITE_URL } from '~/constants/app'
import { authClient } from '~/features/auth/client/authClient'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { Logo } from '~/interface/app/Logo'
import { Pressable } from '~/interface/buttons/Pressable'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { MediumText } from '~/interface/text/Body'
import { H3 } from '~/interface/text/Headings'

export const WaitingListPage = () => {
  useOnboarding()

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      router.dismissAll()
      router.replace('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const onOpenDiscord = () => {
    Linking.openURL(DISCORD_INVITE_URL)
  }

  return (
    <YStack flex={1} bg="$background">
      <YStack flex={1} px="$3" items="center" justify="center" gap="$6" pb="$14">
        <XStack>
          <Logo size={22} />
        </XStack>

        <YStack gap="$4" items="center">
          <H3 color="$color12" text="center" fontWeight="600">
            You're on the list
          </H3>

          <MediumText color="$color11" text="center" fontWeight="300" maxW="90%">
            Users are being let in waves, and your invite will arrive soon. Keep an eye on
            your email for access in the coming days.
          </MediumText>
        </YStack>

        <YStack gap="$3" width="100%">
          {/* <ButtonSimple size="large" onPress={onOpenDiscord} icon={DiscordLogo}>
            <ButtonSimple.Text>Join Discord</ButtonSimple.Text>
          </ButtonSimple> */}
        </YStack>
      </YStack>
    </YStack>
  )
}
