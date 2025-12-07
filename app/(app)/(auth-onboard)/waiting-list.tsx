import { XStack, YStack } from 'tamagui'

import { Logo } from '~/interface/app/Logo'
import { MediumText } from '~/interface/text/Body'
import { H3 } from '~/interface/text/Headings'

export const WaitingListPage = () => {
  return (
    <YStack flex={1} bg="$background">
      <YStack flex={1} px="$3" items="center" justify="center" gap="$6" pb="$14">
        <XStack>
          <Logo height={22} />
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
      </YStack>
    </YStack>
  )
}
