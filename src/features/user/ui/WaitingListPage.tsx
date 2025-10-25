import { YStack, SizableText, XStack } from 'tamagui'
import { router } from 'one'
import { authClient } from '~/auth/client/authClient'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { H2, H3 } from '~/interface/text/Headings'
import { Image } from '~/interface/image/Image'
import { ProgressBar } from '~/interface/progress-bar/ProgressBar'
import { MediumText } from '~/interface/text/Body'
import { DiscordLogo } from '~/interface/social-media/DiscordLogo'
import { Linking } from 'react-native'
import { useAfterLoginRedirect } from '~/auth/hooks/useAfterLoginRedirect'
import { RepeatedTapToShowDevTools } from '~/interface/interactions/RepeatedTapToShowDevTools'

export const WaitingListPage = () => {
  useAfterLoginRedirect()

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
    Linking.openURL('https://discord.com/invite/fleek')
  }

  return (
    <YStack flex={1} bg="$background">
      <ProgressBar totalSteps={6} currentStep={2} />
      <YStack pt={22}>
        <BasicHeader BackIcon={CaretLeftIcon} onClose={handleLogout} />
      </YStack>
      <YStack flex={1} px="$3" items="center" justify="center" gap="$6" pb="$14">
        <XStack>
          <RepeatedTapToShowDevTools>
            {({ handleTap }) => (
              <Image
                src={require('../../../../assets/apps/logo-white.png')}
                width={22}
                height={56}
                objectFit="contain"
                tintColor="$color12"
                onPress={handleTap}
              />
            )}
          </RepeatedTapToShowDevTools>
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
          <ButtonSimple size="large" onPress={onOpenDiscord} icon={DiscordLogo}>
            <ButtonSimple.Text>Join Discord</ButtonSimple.Text>
          </ButtonSimple>
        </YStack>
      </YStack>
    </YStack>
  )
}
