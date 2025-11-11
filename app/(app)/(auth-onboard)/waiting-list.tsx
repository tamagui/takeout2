import { router } from 'one'
import { Linking } from 'react-native'
import { XStack, YStack } from 'tamagui'
import { DISCORD_INVITE_URL } from '~/constants/app'
import { images } from '~/constants/images'
import { authClient } from '~/features/auth/client/authClient'
import { useOnboarding } from '~/features/onboarding/useOnboarding'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { Image } from '~/interface/image/Image'
import { RepeatedTapToShowDevTools } from '~/interface/interactions/RepeatedTapToShowDevTools'
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
      <YStack pt={22}>
        <BasicHeader BackIcon={CaretLeftIcon} onClose={handleLogout} />
      </YStack>
      <YStack flex={1} px="$3" items="center" justify="center" gap="$6" pb="$14">
        <XStack>
          <RepeatedTapToShowDevTools>
            {({ handleTap }) => (
              <Image
                src={images.iconTakeout}
                width={22}
                height={56}
                objectFit="contain"
                tintColor="white"
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
          {/* <ButtonSimple size="large" onPress={onOpenDiscord} icon={DiscordLogo}>
            <ButtonSimple.Text>Join Discord</ButtonSimple.Text>
          </ButtonSimple> */}
        </YStack>
      </YStack>
    </YStack>
  )
}
